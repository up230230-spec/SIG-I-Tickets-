const mongoose = require('mongoose');

/**
 * Respuesta a un hilo del foro.
 * - isOfficial: respuesta oficial con etiqueta diferenciada (admin/operaciones).
 */
const ForumReplySchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    isOfficial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ForumReply', ForumReplySchema);
