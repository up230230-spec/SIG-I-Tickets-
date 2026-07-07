/**
 * Módulos B/C — Reporte y gestión de tickets.
 *
 * Reglas clave:
 *  - Asignación automática de área/severidad según el código INC (catálogo).
 *  - Folio legible TCK-AAAA-###### generado al crear.
 *  - Anti-duplicados por clientSideId.
 *  - Severidad crítica / emergencia → alerta masiva inmediata (alertService).
 *  - Flujo de estados abierto→en_proceso→resuelto→cerrado; cada cambio exige
 *    comentario. Excepción resuelto→en_proceso solo Operaciones.
 *  - Acciones sensibles → AuditLog.
 */
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { resolveIncidentType, AREAS, SEVERITY } = require('../config/incidentCatalog');
const { PERMISSIONS, roleHasPermission } = require('../config/roles');
const { recordAudit } = require('../middleware/audit');
const alertService = require('../services/alertService');

const STATUS = Ticket.STATUS;

// --- Helpers -------------------------------------------------------------

// Genera un folio único TCK-AAAA-######. Reintenta si hay colisión.
const generateFolio = async () => {
  const year = new Date().getFullYear();
  const count = await Ticket.countDocuments({
    createdAt: { $gte: new Date(`${year}-01-01T00:00:00Z`) },
  });
  return `TCK-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Construye el filtro de listado según los permisos del usuario.
const scopeFilterForUser = (user) => {
  if (roleHasPermission(user.role, PERMISSIONS.TICKET_READ_ALL)) return {};
  if (roleHasPermission(user.role, PERMISSIONS.TICKET_READ_AREA)) return { area: user.area };
  // usuario_general / jefe_carrera: solo lo que reportaron.
  return { reportedBy: user._id };
};

// ¿Puede este usuario ver/gestionar este ticket concreto?
const canAccessTicket = (user, ticket) => {
  if (roleHasPermission(user.role, PERMISSIONS.TICKET_READ_ALL)) return true;
  if (roleHasPermission(user.role, PERMISSIONS.TICKET_READ_AREA)) {
    return ticket.area === user.area;
  }
  return String(ticket.reportedBy?._id || ticket.reportedBy) === String(user._id);
};

const canSeeInternal = (user) =>
  roleHasPermission(user.role, PERMISSIONS.COMMENT_INTERNAL);

// Vista serializable de un ticket (con relaciones pobladas si existen).
const ticketView = (t) => ({
  id: t._id,
  folio: t.folio,
  incidentCode: t.incidentCode,
  title: t.title,
  description: t.description,
  area: t.area,
  severity: t.severity,
  status: t.status,
  isEmergency: t.isEmergency,
  location: t.location,
  images: t.images,
  escalated: t.escalated,
  reportedBy: t.reportedBy?.name
    ? { id: t.reportedBy._id, name: t.reportedBy.name, email: t.reportedBy.email }
    : t.reportedBy,
  assignedTo: t.assignedTo?.name
    ? { id: t.assignedTo._id, name: t.assignedTo.name }
    : t.assignedTo,
  createdAt: t.createdAt,
  lastActivityAt: t.lastActivityAt,
  resolvedAt: t.resolvedAt,
  closedAt: t.closedAt,
});

// --- Endpoints -----------------------------------------------------------

// POST /api/tickets — crear ticket con asignación automática.
exports.createTicket = async (req, res, next) => {
  try {
    const { incidentCode, title, description, location, images, clientSideId } = req.body;

    const type = resolveIncidentType(incidentCode);
    if (!type) {
      return res.status(400).json({ message: 'Código de incidencia no válido.' });
    }
    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción son obligatorios.' });
    }
    if (Array.isArray(images) && images.length > 3) {
      return res.status(400).json({ message: 'Máximo 3 imágenes por ticket.' });
    }

    // Anti-duplicados: si ya existe un ticket con el mismo clientSideId, lo devuelve.
    if (clientSideId) {
      const dup = await Ticket.findOne({ clientSideId, reportedBy: req.user._id });
      if (dup) return res.status(200).json(ticketView(dup));
    }

    const ticket = await Ticket.create({
      folio: await generateFolio(),
      incidentCode,
      title,
      description,
      area: type.area,          // asignación automática
      severity: type.severity,  // severidad automática
      location: location || '',
      images: Array.isArray(images) ? images.slice(0, 3) : [],
      reportedBy: req.user._id,
      clientSideId: clientSideId || undefined,
    });

    await recordAudit(req, 'ticket.create', 'Ticket', ticket._id, {
      folio: ticket.folio,
      area: ticket.area,
      severity: ticket.severity,
    });

    // Alerta masiva inmediata si es crítico.
    if (ticket.severity === SEVERITY.CRITICA) {
      alertService.broadcastCriticalAlert(ticket);
    }
    alertService.notifyArea(ticket.area, 'ticket_created', ticketView(ticket));

    return res.status(201).json(ticketView(ticket));
  } catch (err) {
    if (err.code === 11000) {
      // Colisión de folio o clientSideId: reintento simple.
      return exports.createTicket(req, res, next);
    }
    next(err);
  }
};

// POST /api/tickets/emergency — botón de Emergencia (2 campos, alerta inmediata).
exports.createEmergency = async (req, res, next) => {
  try {
    const { description, location } = req.body;
    if (!description) {
      return res.status(400).json({ message: 'Describe brevemente la emergencia.' });
    }

    const ticket = await Ticket.create({
      folio: await generateFolio(),
      incidentCode: 'INC-EMERGENCY',
      title: '🚨 Emergencia',
      description,
      area: AREAS.SEGURIDAD,
      severity: SEVERITY.CRITICA,
      isEmergency: true,
      location: location || '',
      reportedBy: req.user._id,
    });

    await recordAudit(req, 'ticket.emergency', 'Ticket', ticket._id, { folio: ticket.folio });
    alertService.broadcastCriticalAlert(ticket);

    return res.status(201).json(ticketView(ticket));
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets — lista filtrada según rol.
exports.listTickets = async (req, res, next) => {
  try {
    const filter = scopeFilterForUser(req.user);

    // Filtros opcionales por querystring.
    if (req.query.status) filter.status = req.query.status;
    if (req.query.area && roleHasPermission(req.user.role, PERMISSIONS.TICKET_READ_ALL)) {
      filter.area = req.query.area;
    }
    if (req.query.severity) filter.severity = req.query.severity;

    const tickets = await Ticket.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json(tickets.map(ticketView));
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/:id — detalle con comentarios visibles según rol.
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name');
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'No tienes acceso a este ticket.' });
    }

    const commentFilter = { ticket: ticket._id };
    if (!canSeeInternal(req.user)) commentFilter.visibility = 'public';

    const comments = await Comment.find(commentFilter)
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    return res.json({
      ...ticketView(ticket),
      comments: comments.map((c) => ({
        id: c._id,
        body: c.body,
        visibility: c.visibility,
        author: c.author ? { name: c.author.name, role: c.author.role } : null,
        statusChange: c.statusChange,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tickets/:id/status — cambio de estado con comentario obligatorio.
exports.updateStatus = async (req, res, next) => {
  try {
    const { status: to, comment } = req.body;
    if (!to || !comment) {
      return res.status(400).json({ message: 'El nuevo estado y un comentario son obligatorios.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'No puedes gestionar este ticket.' });
    }

    const from = ticket.status;
    const allowed = Ticket.allowedTransitions[from] || [];
    const isOpsException =
      from === STATUS.RESUELTO &&
      to === STATUS.EN_PROCESO &&
      roleHasPermission(req.user.role, PERMISSIONS.TICKET_UPDATE_STATUS) &&
      req.user.role === 'operaciones';

    if (!allowed.includes(to) && !isOpsException) {
      return res.status(400).json({
        message: `Transición no permitida: ${from} → ${to}.`,
      });
    }

    ticket.status = to;
    ticket.lastActivityAt = new Date();
    if (to === STATUS.RESUELTO) ticket.resolvedAt = new Date();
    if (to === STATUS.CERRADO) ticket.closedAt = new Date();
    if (to === STATUS.EN_PROCESO && !ticket.assignedTo) ticket.assignedTo = req.user._id;
    await ticket.save();

    await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      body: comment,
      visibility: 'public',
      statusChange: { from, to },
    });

    await recordAudit(req, 'ticket.status_change', 'Ticket', ticket._id, { from, to });
    alertService.notifyArea(ticket.area, 'ticket_updated', ticketView(ticket));

    return res.json(ticketView(ticket));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tickets/:id/reassign — reasignar con nota de motivo.
exports.reassignTicket = async (req, res, next) => {
  try {
    const { assignedTo, reason } = req.body;
    if (!assignedTo || !reason) {
      return res.status(400).json({ message: 'Destinatario y motivo de reasignación son obligatorios.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

    const target = await User.findById(assignedTo);
    if (!target) return res.status(404).json({ message: 'Usuario destino no encontrado.' });

    const previous = ticket.assignedTo;
    ticket.assignedTo = target._id;
    ticket.lastActivityAt = new Date();
    await ticket.save();

    await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      body: `Reasignado a ${target.name}. Motivo: ${reason}`,
      visibility: 'internal',
    });

    await recordAudit(req, 'ticket.reassign', 'Ticket', ticket._id, {
      from: previous,
      to: target._id,
      reason,
    });

    return res.json(ticketView(ticket));
  } catch (err) {
    next(err);
  }
};

// POST /api/tickets/:id/comments — agregar comentario (público o interno).
exports.addComment = async (req, res, next) => {
  try {
    const { body, visibility = 'public' } = req.body;
    if (!body) return res.status(400).json({ message: 'El comentario no puede estar vacío.' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'No tienes acceso a este ticket.' });
    }
    if (visibility === 'internal' && !canSeeInternal(req.user)) {
      return res.status(403).json({ message: 'No puedes crear comentarios internos.' });
    }

    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      body,
      visibility: visibility === 'internal' ? 'internal' : 'public',
    });
    ticket.lastActivityAt = new Date();
    await ticket.save();

    await comment.populate('author', 'name role');
    return res.status(201).json({
      id: comment._id,
      body: comment.body,
      visibility: comment.visibility,
      author: { name: comment.author.name, role: comment.author.role },
      createdAt: comment.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tickets/:id — eliminar (solo Operaciones).
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

    await Comment.deleteMany({ ticket: ticket._id });
    await ticket.deleteOne();

    await recordAudit(req, 'ticket.delete', 'Ticket', ticket._id, { folio: ticket.folio });
    return res.json({ message: 'Ticket eliminado.', id: ticket._id });
  } catch (err) {
    next(err);
  }
};
