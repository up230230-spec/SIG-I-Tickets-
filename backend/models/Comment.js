const mongoose = require('mongoose');

/**
 * Comentario sobre un ticket.
 * - visibility 'public': visible para el usuario que reportó.
 * - visibility 'internal': solo administradores/operaciones.
 * Los comentarios de cambio de estado se marcan con statusChange.
 */
const CommentSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    visibility: { type: String, enum: ['public', 'internal'], default: 'public' },

    // Si el comentario acompaña un cambio de estado, se registra aquí.
    statusChange: {
      from: { type: String, default: null },
      to: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
