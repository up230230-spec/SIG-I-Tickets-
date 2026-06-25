/**
 * Escalamiento automático (regla de negocio):
 * un ticket sin cambios por ESCALATION_HOURS (48h) sube a severidad Alta.
 *
 * STUB: define el job. En producción correr con un scheduler (node-cron) o un
 * cron externo que invoque runEscalationSweep() periódicamente.
 */
const { ESCALATION_HOURS } = require('../config/env');

const runEscalationSweep = async () => {
  // TODO:
  //  1. Buscar tickets con status abierto/en_proceso y lastActivityAt < now - 48h, escalated=false.
  //  2. Subir severity a 'alta', marcar escalated=true, registrar en AuditLog.
  //  3. Notificar al área (alertService.notifyArea).
  console.log(`[escalationService] Sweep (umbral ${ESCALATION_HOURS}h) — TODO implementar.`);
};

module.exports = { runEscalationSweep };
