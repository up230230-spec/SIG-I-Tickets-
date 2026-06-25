const mongoose = require('mongoose');

/**
 * Área operativa responsable (TI, Mantenimiento, Seguridad...).
 * Permite asignar administradores y consultar métricas por área (Módulo D).
 * El catálogo base vive en config/incidentCatalog.js; esta colección guarda
 * la configuración persistente y editable de cada área.
 */
const AreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    color: { type: String, default: '#888888' }, // Para el código de colores / mapa de calor
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Area', AreaSchema);
