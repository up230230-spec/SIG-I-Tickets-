/**
 * Módulo D (parcial) — Datos para paneles y dashboards.
 *
 *  - global:    vista de todos los tickets + agregados (Operaciones).
 *  - heatmap:   conteo por área (con color) para el mapa de calor.
 *  - executive: KPIs para el Rector (SLA, tiempos de respuesta, volumen).
 *
 * Todo se calcula con agregaciones de MongoDB para escalar sin traer los
 * documentos completos al proceso Node.
 */
const Ticket = require('../models/Ticket');
const Area = require('../models/Area');
const Comment = require('../models/Comment');
const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const { AREAS, SEVERITY } = require('../config/incidentCatalog');
const { PERMISSIONS, roleHasPermission } = require('../config/roles');

const STATUS = Ticket.STATUS;

// SLA objetivo (horas hasta resolución) por severidad. Base de los KPIs.
const SLA_HOURS = {
  [SEVERITY.CRITICA]: 4,
  [SEVERITY.ALTA]: 24,
  [SEVERITY.MEDIA]: 72,
};

const HOUR_MS = 60 * 60 * 1000;

// Convierte [{ _id, count }] en un objeto { clave: conteo } (rellena claves esperadas).
const tally = (rows, keys) => {
  const out = {};
  if (keys) keys.forEach((k) => (out[k] = 0));
  rows.forEach((r) => {
    out[r._id ?? 'sin_definir'] = r.count;
  });
  return out;
};

// GET /api/dashboard/global — vista global (Operaciones).
exports.global = async (req, res, next) => {
  try {
    const [byStatus, byArea, bySeverity, escalated, emergencies, total, recent] =
      await Promise.all([
        Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Ticket.aggregate([{ $group: { _id: '$area', count: { $sum: 1 } } }]),
        Ticket.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
        Ticket.countDocuments({ escalated: true }),
        Ticket.countDocuments({ isEmergency: true, status: { $ne: STATUS.CERRADO } }),
        Ticket.countDocuments(),
        Ticket.find()
          .populate('reportedBy', 'name email')
          .populate('assignedTo', 'name')
          .sort({ createdAt: -1 })
          .limit(20),
      ]);

    return res.json({
      total,
      byStatus: tally(byStatus, Object.values(STATUS)),
      byArea: tally(byArea, Object.values(AREAS)),
      bySeverity: tally(bySeverity, Object.values(SEVERITY)),
      escalated,
      activeEmergencies: emergencies,
      recent: recent.map((t) => ({
        id: t._id,
        folio: t.folio,
        incidentCode: t.incidentCode,
        title: t.title,
        area: t.area,
        severity: t.severity,
        status: t.status,
        isEmergency: t.isEmergency,
        reportedBy: t.reportedBy?.name
          ? { id: t.reportedBy._id, name: t.reportedBy.name }
          : null,
        assignedTo: t.assignedTo?.name
          ? { id: t.assignedTo._id, name: t.assignedTo.name }
          : null,
        createdAt: t.createdAt,
        lastActivityAt: t.lastActivityAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/heatmap — mapa de calor por área.
exports.heatmap = async (req, res, next) => {
  try {
    const [openByArea, areas] = await Promise.all([
      // Tickets sin cerrar por área (los que "calientan" el mapa).
      Ticket.aggregate([
        { $match: { status: { $ne: STATUS.CERRADO } } },
        {
          $group: {
            _id: '$area',
            open: { $sum: 1 },
            critical: {
              $sum: { $cond: [{ $eq: ['$severity', SEVERITY.CRITICA] }, 1, 0] },
            },
          },
        },
      ]),
      Area.find().select('name color'),
    ]);

    const colorFor = {};
    areas.forEach((a) => (colorFor[a.name] = a.color));

    const map = openByArea.reduce((acc, r) => {
      acc[r._id] = { open: r.open, critical: r.critical };
      return acc;
    }, {});

    // Salida ordenada e incluyendo todas las áreas conocidas (aunque estén en 0).
    const cells = Object.values(AREAS)
      .filter((name) => name !== AREAS.SIN_DEFINIR)
      .map((name) => ({
        area: name,
        color: colorFor[name] || '#888888',
        open: map[name]?.open || 0,
        critical: map[name]?.critical || 0,
      }))
      .sort((a, b) => b.open - a.open);

    return res.json(cells);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/executive — KPIs ejecutivos (Rector).
exports.executive = async (req, res, next) => {
  try {
    const [total, resolvedRows, byArea, bySeverity, openBacklog, escalated] =
      await Promise.all([
        Ticket.countDocuments(),
        // Tickets resueltos/cerrados con su tiempo de resolución (ms) y severidad.
        Ticket.aggregate([
          { $match: { resolvedAt: { $ne: null } } },
          {
            $project: {
              severity: 1,
              resolutionMs: { $subtract: ['$resolvedAt', '$createdAt'] },
            },
          },
        ]),
        Ticket.aggregate([{ $group: { _id: '$area', count: { $sum: 1 } } }]),
        Ticket.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
        Ticket.countDocuments({ status: { $in: [STATUS.ABIERTO, STATUS.EN_PROCESO] } }),
        Ticket.countDocuments({ escalated: true }),
      ]);

    // Tiempo medio de resolución (horas) y cumplimiento de SLA.
    let sumHours = 0;
    let withinSla = 0;
    resolvedRows.forEach((r) => {
      const hours = r.resolutionMs / HOUR_MS;
      sumHours += hours;
      const target = SLA_HOURS[r.severity] ?? SLA_HOURS[SEVERITY.MEDIA];
      if (hours <= target) withinSla += 1;
    });
    const resolvedCount = resolvedRows.length;
    const avgResolutionHours = resolvedCount ? +(sumHours / resolvedCount).toFixed(1) : 0;
    const slaCompliance = resolvedCount ? Math.round((withinSla / resolvedCount) * 100) : 100;

    return res.json({
      total,
      resolved: resolvedCount,
      openBacklog,
      escalated,
      avgResolutionHours,
      slaCompliance, // % de tickets resueltos dentro del SLA por severidad
      slaTargets: SLA_HOURS,
      volumeByArea: tally(byArea, Object.values(AREAS)),
      volumeBySeverity: tally(bySeverity, Object.values(SEVERITY)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/me — Actividad personal del usuario autenticado.
//
// Reúne en un solo lugar TODO lo que el usuario ha hecho en la plataforma:
// tickets que reportó, comentarios, hilos y respuestas del foro y —para roles
// de gestión— tickets asignados y cambios de estado que aplicó. Disponible para
// CUALQUIER rol (solo requiere sesión); cada rol ve su propia huella.
exports.myActivity = async (req, res, next) => {
  try {
    const uid = req.user._id;
    // Roles que además gestionan tickets (reciben asignaciones y cambian estados).
    const manages = roleHasPermission(req.user.role, PERMISSIONS.TICKET_UPDATE_STATUS);

    const [
      reportedByStatus,   // tickets propios agrupados por estado
      recentReported,     // últimos tickets reportados (para la lista/timeline)
      commentsCount,      // comentarios escritos por el usuario
      statusChanges,      // comentarios que acompañaron un cambio de estado
      assignedCount,      // tickets asignados actualmente (gestión)
      resolvedByMe,       // tickets resueltos/cerrados asignados al usuario (gestión)
      postsCount,         // total de hilos del foro creados
      posts,              // últimos hilos (para la lista/timeline)
      repliesCount,       // respuestas en el foro
      officialReplies,    // respuestas marcadas como oficiales
    ] = await Promise.all([
      Ticket.aggregate([
        { $match: { reportedBy: uid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Ticket.find({ reportedBy: uid })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('folio title area severity status isEmergency createdAt'),
      Comment.countDocuments({ author: uid }),
      Comment.countDocuments({ author: uid, 'statusChange.to': { $ne: null } }),
      manages ? Ticket.countDocuments({ assignedTo: uid }) : 0,
      manages
        ? Ticket.countDocuments({ assignedTo: uid, status: { $in: [STATUS.RESUELTO, STATUS.CERRADO] } })
        : 0,
      ForumPost.countDocuments({ author: uid }),
      ForumPost.find({ author: uid })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('title category pinned closed createdAt'),
      ForumReply.countDocuments({ author: uid }),
      ForumReply.countDocuments({ author: uid, isOfficial: true }),
    ]);

    const byStatus = tally(reportedByStatus, Object.values(STATUS));
    const reportedTotal = Object.values(byStatus).reduce((a, b) => a + b, 0);

    // Línea de tiempo unificada: mezcla las actividades recientes y las ordena
    // cronológicamente (lo más nuevo primero) para un feed de "qué he hecho".
    const timeline = [
      ...recentReported.map((t) => ({
        type: 'ticket',
        at: t.createdAt,
        title: t.title,
        meta: `${t.folio} · ${t.area} · ${t.status}`,
        severity: t.severity,
        emergency: t.isEmergency,
        refId: t._id,
      })),
      ...posts.map((p) => ({
        type: 'forum_post',
        at: p.createdAt,
        title: p.title,
        meta: `Foro · ${p.category}${p.pinned ? ' · fijado' : ''}${p.closed ? ' · cerrado' : ''}`,
        refId: p._id,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 12);

    return res.json({
      user: { id: uid, name: req.user.name, role: req.user.role, email: req.user.email },
      memberSince: req.user.createdAt,
      manages,
      tickets: {
        reported: reportedTotal,
        byStatus,
        recent: recentReported.map((t) => ({
          id: t._id,
          folio: t.folio,
          title: t.title,
          area: t.area,
          severity: t.severity,
          status: t.status,
          isEmergency: t.isEmergency,
          createdAt: t.createdAt,
        })),
      },
      management: manages
        ? { assigned: assignedCount, resolved: resolvedByMe, statusChanges }
        : null,
      forum: {
        posts: postsCount,
        replies: repliesCount,
        officialReplies,
        recent: posts.map((p) => ({
          id: p._id,
          title: p.title,
          category: p.category,
          pinned: p.pinned,
          closed: p.closed,
          createdAt: p.createdAt,
        })),
      },
      comments: commentsCount,
      timeline,
    });
  } catch (err) {
    next(err);
  }
};
