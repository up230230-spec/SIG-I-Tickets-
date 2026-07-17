/**
 * Módulo E — Foro Institucional.
 * Hilos por categoría, publicación anónima, respuestas oficiales (admin/oper.)
 * y moderación (fijar / cerrar / eliminar, solo Operaciones).
 * Estado gestionado con Redux (slice `forum`).
 */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import {
  fetchPosts, fetchPost, createPost, addReply, moderatePost, deletePost, clearDetail,
} from '../store/forumSlice';
import Navbar from '../components/Navbar';

const CATEGORIES = ['sugerencias', 'agradecimientos', 'preguntas', 'otros'];

export default function Forum() {
  const { user } = useAuth();
  const canModerate = user.role === 'operaciones';
  const canOfficial = ['admin_area', 'operaciones'].includes(user.role);

  const dispatch = useDispatch();
  const { posts, detail, error } = useSelector((s) => s.forum);
  const [category, setCategory] = useState('');
  const [form, setForm] = useState({ title: '', body: '', category: 'sugerencias', isAnonymous: false });
  const [reply, setReply] = useState({ body: '', isAnonymous: false, isOfficial: false });

  useEffect(() => { dispatch(fetchPosts(category)); }, [dispatch, category]);

  const createThread = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    try {
      await dispatch(createPost(form)).unwrap();
      setForm({ title: '', body: '', category: 'sugerencias', isAnonymous: false });
      dispatch(fetchPosts(category));
    } catch (err) { alert(err); }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.body.trim()) return;
    await dispatch(addReply({ id: detail.id, ...reply })).unwrap();
    setReply({ body: '', isAnonymous: false, isOfficial: false });
  };

  const moderate = async (patch) => {
    await dispatch(moderatePost({ id: detail.id, patch })).unwrap();
    dispatch(fetchPosts(category));
  };

  const remove = async () => {
    if (!window.confirm('¿Eliminar este hilo y sus respuestas?')) return;
    await dispatch(deletePost(detail.id)).unwrap();
    dispatch(fetchPosts(category));
  };

  return (
    <>
      <Navbar />
      <section className="page">
        <h1>Foro institucional</h1>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="forum-grid">
          {/* Columna izquierda: crear un nuevo hilo */}
          <form className="card" onSubmit={createThread}>
            <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Nuevo hilo</h2>
            <div className="field">
              <label>Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>Mensaje</label>
              <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
            </div>
            <label style={{ display: 'flex', gap: '0.5rem', fontWeight: 400 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />
              Publicar de forma anónima
            </label>
            <button className="btn-primary" style={{ marginTop: '0.75rem' }}>Publicar</button>
          </form>

          {/* Columna derecha: conversaciones (lista de hilos) */}
          <div>
            <div className="page-head" style={{ marginBottom: '0.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--blue-900)' }}>Conversaciones</h2>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Filtrar categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Todas</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {posts.length === 0 ? (
              <p className="empty">No hay hilos en esta categoría.</p>
            ) : posts.map((p) => (
              <div key={p.id} className="card clickable" style={{ marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => dispatch(fetchPost(p.id))}>
                <div className="meta">
                  {p.pinned && '📌 '}<span className="badge">{p.category}</span> · {p.author?.name || 'Anónimo'} · {p.replyCount} respuestas {p.closed && '· 🔒 cerrado'}
                </div>
                <h3 style={{ margin: '0.35rem 0', color: 'var(--blue-800)' }}>{p.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle del hilo seleccionado (ancho completo, debajo) */}
        {detail && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h2 style={{ flex: 1, margin: 0, color: 'var(--blue-900)' }}>
                    {detail.pinned && '📌 '}{detail.title}
                  </h2>
                  <button className="btn-ghost" onClick={() => dispatch(clearDetail())}>Cerrar</button>
                </div>
                <p className="meta">
                  <span className="badge">{detail.category}</span> · {detail.author?.name || 'Anónimo'}
                  {detail.author?.anonymous && canModerate && ' (anónimo)'}
                </p>
                <p>{detail.body}</p>

                {canModerate && (
                  <div style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}>
                    <button className="btn-ghost" onClick={() => moderate({ pinned: !detail.pinned })}>
                      {detail.pinned ? 'Desfijar' : 'Fijar'}
                    </button>
                    <button className="btn-ghost" onClick={() => moderate({ closed: !detail.closed })}>
                      {detail.closed ? 'Reabrir' : 'Cerrar'}
                    </button>
                    <button className="btn-ghost" style={{ color: '#b91c1c' }} onClick={remove}>Eliminar</button>
                  </div>
                )}

                <h3 style={{ color: 'var(--blue-800)' }}>Respuestas</h3>
                {(detail.replies || []).length === 0 && <p className="meta">Sé el primero en responder.</p>}
                {(detail.replies || []).map((r) => (
                  <div key={r.id} style={{ borderLeft: `3px solid ${r.isOfficial ? '#15803d' : 'var(--border)'}`, padding: '0.25rem 0.75rem', margin: '0.5rem 0' }}>
                    <div className="meta">
                      {r.author?.name || 'Anónimo'} {r.isOfficial && <span className="badge official">Respuesta oficial</span>}
                    </div>
                    <div>{r.body}</div>
                  </div>
                ))}

                {!detail.closed && (
                  <form onSubmit={sendReply} style={{ marginTop: '0.75rem' }}>
                    <div className="field">
                      <textarea rows={2} value={reply.body} placeholder="Escribe una respuesta…"
                        onChange={(e) => setReply({ ...reply, body: e.target.value })} required />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <label style={{ display: 'flex', gap: '0.4rem', fontWeight: 400 }}>
                        <input type="checkbox" style={{ width: 'auto' }} checked={reply.isAnonymous}
                          onChange={(e) => setReply({ ...reply, isAnonymous: e.target.checked })} />
                        Anónima
                      </label>
                      {canOfficial && (
                        <label style={{ display: 'flex', gap: '0.4rem', fontWeight: 400 }}>
                          <input type="checkbox" style={{ width: 'auto' }} checked={reply.isOfficial}
                            onChange={(e) => setReply({ ...reply, isOfficial: e.target.checked })} />
                          Respuesta oficial
                        </label>
                      )}
                      <button className="btn-primary" style={{ marginLeft: 'auto' }}>Responder</button>
                    </div>
                  </form>
                )}
          </div>
        )}
      </section>
    </>
  );
}
