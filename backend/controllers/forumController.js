/**
 * Módulo E — Foro Institucional.
 *
 *  - Publicación anónima: el autor real se guarda siempre (para moderación),
 *    pero solo lo ven quienes tienen FORUM_MODERATE (Operaciones).
 *  - Respuestas oficiales (isOfficial): reservadas a quien tenga
 *    FORUM_OFFICIAL_REPLY (admin de área / operaciones).
 *  - Moderación: fijar (pinned), cerrar (closed) y eliminar hilos.
 */
const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const { PERMISSIONS, roleHasPermission } = require('../config/roles');
const { recordAudit } = require('../middleware/audit');

const CATEGORIES = ForumPost.CATEGORIES;

const canModerate = (user) => roleHasPermission(user.role, PERMISSIONS.FORUM_MODERATE);
const canReplyOfficial = (user) =>
  roleHasPermission(user.role, PERMISSIONS.FORUM_OFFICIAL_REPLY);

// Devuelve el autor visible respetando el anonimato (los moderadores sí lo ven).
const authorView = (entity, viewer) => {
  const author = entity.author;
  if (entity.isAnonymous) {
    if (canModerate(viewer) && author?.name) {
      return { name: author.name, anonymous: true }; // el moderador ve el nombre real
    }
    return { name: 'Anónimo', anonymous: true };
  }
  return author?.name ? { id: author._id, name: author.name, role: author.role } : null;
};

const postView = (p, viewer, replyCount) => ({
  id: p._id,
  title: p.title,
  body: p.body,
  category: p.category,
  pinned: p.pinned,
  closed: p.closed,
  isAnonymous: p.isAnonymous,
  author: authorView(p, viewer),
  replyCount: replyCount ?? undefined,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

// GET /api/forum — listar hilos (filtro opcional ?category=).
exports.listPosts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const posts = await ForumPost.find(filter)
      .populate('author', 'name role')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(200);

    // Conteo de respuestas por hilo (una sola agregación).
    const ids = posts.map((p) => p._id);
    const counts = await ForumReply.aggregate([
      { $match: { post: { $in: ids } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const countBy = counts.reduce((acc, c) => {
      acc[String(c._id)] = c.count;
      return acc;
    }, {});

    return res.json(posts.map((p) => postView(p, req.user, countBy[String(p._id)] || 0)));
  } catch (err) {
    next(err);
  }
};

// POST /api/forum — crear hilo (anónimo opcional).
exports.createPost = async (req, res, next) => {
  try {
    const { title, body, category, isAnonymous } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'Título y contenido son obligatorios.' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Categoría no válida.' });
    }

    const post = await ForumPost.create({
      title,
      body,
      category,
      author: req.user._id,
      isAnonymous: !!isAnonymous,
    });

    await recordAudit(req, 'forum.post_create', 'ForumPost', post._id, {
      category,
      anonymous: !!isAnonymous,
    });

    await post.populate('author', 'name role');
    return res.status(201).json(postView(post, req.user, 0));
  } catch (err) {
    next(err);
  }
};

// GET /api/forum/:id — hilo + respuestas.
exports.getPost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate('author', 'name role');
    if (!post) return res.status(404).json({ message: 'Hilo no encontrado.' });

    const replies = await ForumReply.find({ post: post._id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    return res.json({
      ...postView(post, req.user),
      replies: replies.map((r) => ({
        id: r._id,
        body: r.body,
        isOfficial: r.isOfficial,
        isAnonymous: r.isAnonymous,
        author: authorView(r, req.user),
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/forum/:id/replies — responder (oficial si el rol lo permite).
exports.addReply = async (req, res, next) => {
  try {
    const { body, isAnonymous, isOfficial } = req.body;
    if (!body) return res.status(400).json({ message: 'La respuesta no puede estar vacía.' });

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Hilo no encontrado.' });
    if (post.closed) {
      return res.status(409).json({ message: 'Este hilo está cerrado a nuevas respuestas.' });
    }

    // La marca oficial solo se aplica si el rol tiene el permiso.
    const official = !!isOfficial && canReplyOfficial(req.user);

    const reply = await ForumReply.create({
      post: post._id,
      author: req.user._id,
      body,
      isAnonymous: !!isAnonymous && !official, // una respuesta oficial nunca es anónima
      isOfficial: official,
    });

    await reply.populate('author', 'name role');
    return res.status(201).json({
      id: reply._id,
      body: reply.body,
      isOfficial: reply.isOfficial,
      isAnonymous: reply.isAnonymous,
      author: authorView(reply, req.user),
      createdAt: reply.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/forum/:id/moderate — fijar / cerrar (moderación).
exports.moderatePost = async (req, res, next) => {
  try {
    const { pinned, closed } = req.body;
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Hilo no encontrado.' });

    if (pinned !== undefined) post.pinned = !!pinned;
    if (closed !== undefined) post.closed = !!closed;
    await post.save();

    await recordAudit(req, 'forum.moderate', 'ForumPost', post._id, {
      pinned: post.pinned,
      closed: post.closed,
    });

    await post.populate('author', 'name role');
    return res.json(postView(post, req.user));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/forum/:id — eliminar hilo y sus respuestas (moderación).
exports.deletePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Hilo no encontrado.' });

    await ForumReply.deleteMany({ post: post._id });
    await post.deleteOne();

    await recordAudit(req, 'forum.delete', 'ForumPost', post._id, { title: post.title });
    return res.json({ message: 'Hilo eliminado.', id: post._id });
  } catch (err) {
    next(err);
  }
};
