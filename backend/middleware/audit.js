const AuditLog = require('../models/AuditLog');

/**
 * Helper para registrar acciones en la bitácora de auditoría (append-only).
 * Se llama explícitamente desde los controllers tras una acción sensible.
 *
 *   await recordAudit(req, 'ticket.status_change', 'Ticket', ticket._id, { from, to });
 *
 * No lanza si falla el log (no debe tumbar la operación principal), pero sí lo
 * reporta a consola para no perder trazabilidad de forma silenciosa.
 */
const recordAudit = async (req, action, entityType = null, entityId = null, metadata = {}) => {
  try {
    await AuditLog.create({
      actor: req.user ? req.user._id : null,
      action,
      entityType,
      entityId,
      metadata,
      ip: req.ip,
    });
  } catch (err) {
    console.error('⚠️  No se pudo escribir en AuditLog:', err.message);
  }
};

module.exports = { recordAudit };
