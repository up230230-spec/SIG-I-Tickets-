const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['medical', 'structural', 'supplies', 'rescue'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // --- CAMPOS NUEVOS NECESARIOS ---
  clientSideId: { type: String }, // Para evitar duplicados
  location: {                     // Para el GPS
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  }
}, {
  timestamps: true // Esto crea automáticamente la fecha (createdAt)
});

module.exports = mongoose.model('Incident', IncidentSchema);