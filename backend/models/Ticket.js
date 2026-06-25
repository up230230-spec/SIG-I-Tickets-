const mongoose = require('mongoose');
const { AREAS, SEVERITY } = require('../config/incidentCatalog');

/**
 * Ticket de incidencia (núcleo del sistema, Módulos B/C/D).
 *
 * Flujo de estados unidireccional:
 *   abierto → en_proceso → resuelto → cerrado
 * Excepción: resuelto → en_proceso (solo Operaciones, ver ticketController).
 *
 * Cada cambio de estado exige un comentario (se registra en Comment + AuditLog).
 */
const STATUS = {
  ABIERTO: 'abierto',
  EN_PROCESO: 'en_proceso',
  RESUELTO: 'resuelto',
  CERRADO: 'cerrado',
};

const TicketSchema = new mongoose.Schema(
  {
    // Folio legible para el usuario (ej. TCK-2026-000123). Lo genera el controller.
    folio: { type: String, unique: true, index: true },

    // Código del catálogo (INC-001...). Determina área y severidad por defecto.
    incidentCode: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    area: { type: String, enum: Object.values(AREAS), required: true },
    severity: { type: String, enum: Object.values(SEVERITY), default: SEVERITY.MEDIA },
    isEmergency: { type: Boolean, default: false }, // Botón de Emergencia (form 2 campos)

    status: { type: String, enum: Object.values(STATUS), default: STATUS.ABIERTO, index: true },

    location: { type: String, default: '' }, // Edificio/aula/zona en texto
    images: [{ type: String }], // Hasta 3 URLs/paths (validado en controller)

    // Relaciones.
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Escalamiento automático: ticket sin cambios 48h → prioridad Alta.
    lastActivityAt: { type: Date, default: Date.now, index: true },
    escalated: { type: Boolean, default: false },

    // Anti-duplicados desde el cliente.
    clientSideId: { type: String, index: true, sparse: true },

    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Transiciones de estado válidas (sin contar la excepción de Operaciones).
TicketSchema.statics.STATUS = STATUS;
TicketSchema.statics.allowedTransitions = {
  [STATUS.ABIERTO]: [STATUS.EN_PROCESO],
  [STATUS.EN_PROCESO]: [STATUS.RESUELTO],
  [STATUS.RESUELTO]: [STATUS.CERRADO], // resuelto→en_proceso es excepción de Operaciones
  [STATUS.CERRADO]: [],
};

module.exports = mongoose.model('Ticket', TicketSchema);
