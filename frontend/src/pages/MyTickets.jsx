/**
 * Módulo B — Mis reportes (usuario general / jefe de carrera).
 * Lista los tickets propios con <TicketCard /> y permite abrir el detalle
 * (estado actual, historial de comentarios y añadir un comentario público).
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import TicketCard from '../components/TicketCard';
import Navbar from '../components/Navbar';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setTickets(await api.get('/tickets'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const open = async (id) => {
    try {
      setDetail(await api.get(`/tickets/${id}`));
    } catch (err) {
      setError(err.message);
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const updated = await api.post(`/tickets/${detail.id}/comments`, { body: comment });
    setDetail({ ...detail, comments: [...(detail.comments || []), updated] });
    setComment('');
  };

  return (
    <>
      <Navbar />
      <section className="page">
        <h1>Mis reportes</h1>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p className="meta">Cargando…</p>
        ) : tickets.length === 0 ? (
          <p className="empty">Aún no has reportado ninguna incidencia.</p>
        ) : (
          <div className="grid cols-2">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={() => open(t.id)} />
            ))}
          </div>
        )}

        {detail && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 style={{ flex: 1, margin: 0 }}>{detail.folio} · {detail.title}</h2>
              <button className="btn-ghost" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
            <p className="meta">
              {detail.area} · <span className={`badge sev-${detail.severity}`}>{detail.severity}</span> · estado: <strong>{detail.status}</strong>
            </p>
            <p>{detail.description}</p>

            <h3 style={{ color: 'var(--blue-800)' }}>Seguimiento</h3>
            {(detail.comments || []).length === 0 && <p className="meta">Sin comentarios todavía.</p>}
            {(detail.comments || []).map((c) => (
              <div key={c.id} style={{ borderLeft: '3px solid var(--border)', padding: '0.25rem 0.75rem', margin: '0.5rem 0' }}>
                <div className="meta">
                  {c.author?.name || 'Sistema'} {c.statusChange && `· ${c.statusChange.from} → ${c.statusChange.to}`}
                </div>
                <div>{c.body}</div>
              </div>
            ))}

            {detail.status !== 'cerrado' && (
              <form onSubmit={sendComment} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <input value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Añadir un comentario…" style={{ flex: 1 }} />
                <button className="btn-primary">Enviar</button>
              </form>
            )}
          </div>
        )}
      </section>
    </>
  );
}
