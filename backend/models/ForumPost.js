const mongoose = require('mongoose');

/**
 * Hilo del Foro Institucional (Módulo E).
 * - Publicación anónima: identidad visible solo para Operaciones.
 * - Moderación: fijar (pinned) y cerrar (closed) hilos.
 */
const CATEGORIES = ['sugerencias', 'agradecimientos', 'preguntas', 'otros'];

const ForumPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, required: true },

    // Siempre se guarda el autor real (para moderación), pero se oculta si isAnonymous.
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },

    // Estado de moderación.
    pinned: { type: Boolean, default: false },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ForumPostSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('ForumPost', ForumPostSchema);
