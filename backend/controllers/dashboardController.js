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
const { AREAS, SEVERITY } = require('../config/incidentCatalog');

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
