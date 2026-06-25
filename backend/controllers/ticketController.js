/**
 * Módulos B/C — Reporte y gestión de tickets.
 *
 * STUB: contrato de endpoints. Lógica clave a implementar:
 *  - create: asignación automática de área/severidad vía resolveIncidentType();
 *            dedupe por clientSideId; si severidad crítica → alertService (≤10s).
 *  - updateStatus: validar transición contra Ticket.allowedTransitions;
 *            exigir comentario; excepción resuelto→en_proceso solo Operaciones;
 *            registrar en AuditLog.
 *  - reassign: nota de motivo obligatoria + AuditLog.
 */
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ message: `TODO: implementar ${name}` });

// POST /api/tickets — crear ticket (con asignación automática).
exports.createTicket = notImplemented('createTicket');

// POST /api/tickets/emergency — botón de Emergencia (formulario de 2 campos, alerta inmediata).
exports.createEmergency = notImplemented('createEmergency');

// GET /api/tickets — lista filtrada según rol (propios / área / programa / todos).
exports.listTickets = notImplemented('listTickets');

// GET /api/tickets/:id — detalle de un ticket (con comentarios visibles según rol).
exports.getTicket = notImplemented('getTicket');

// PATCH /api/tickets/:id/status — cambio de estado con comentario obligatorio.
exports.updateStatus = notImplemented('updateStatus');

// PATCH /api/tickets/:id/reassign — reasignar con nota de motivo.
exports.reassignTicket = notImplemented('reassignTicket');

// POST /api/tickets/:id/comments — agregar comentario (público o interno).
exports.addComment = notImplemented('addComment');

// DELETE /api/tickets/:id — eliminar (Operaciones; doble confirmación para críticos en el front).
exports.deleteTicket = notImplemented('deleteTicket');
