/**
 * Módulo E — Foro Institucional.
 *
 * STUB: contrato de endpoints.
 *  - Publicación anónima: ocultar autor salvo para Operaciones.
 *  - Respuestas oficiales (isOfficial) para admin/operaciones.
 *  - Moderación: fijar, cerrar y eliminar hilos.
 */
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ message: `TODO: implementar ${name}` });

// GET /api/forum — listar hilos (filtros por categoría).
exports.listPosts = notImplemented('listPosts');

// POST /api/forum — crear hilo (anónimo opcional).
exports.createPost = notImplemented('createPost');

// GET /api/forum/:id — hilo + respuestas.
exports.getPost = notImplemented('getPost');

// POST /api/forum/:id/replies — responder (oficial si rol lo permite).
exports.addReply = notImplemented('addReply');

// PATCH /api/forum/:id/moderate — fijar/cerrar (moderación).
exports.moderatePost = notImplemented('moderatePost');

// DELETE /api/forum/:id — eliminar hilo (moderación).
exports.deletePost = notImplemented('deletePost');
