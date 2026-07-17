/**
 * Módulo B — Mis reportes (usuario general / jefe de carrera).
 * Lista SOLO los tickets propios (?mine=1) con <TicketCard /> y permite abrir
 * el detalle (estado, historial de comentarios y añadir un comentario público).
 * Estado gestionado con Redux (slice `tickets`).
 */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTickets, fetchTicket, addComment, clearDetail } from '../store/ticketsSlice';
import TicketCard from '../components/TicketCard';
import Navbar from '../components/Navbar';

export default function MyTickets() {
  const dispatch = useDispatch();
  const { list, detail, loading, error } = useSelector((s) => s.tickets);
  const [comment, setComment] = useState('');

  useEffect(() => {
    dispatch(fetchTickets({ mine: 1 }));
    return () => { dispatch(clearDetail()); };
  }, [dispatch]);

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await dispatch(addComment({ id: detail.id, body: comment })).unwrap();
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
        ) : list.length === 0 ? (
          <p className="empty">Aún no has reportado ninguna incidencia.</p>
        ) : (
          <div className="grid cols-2">
            {list.map((t) => (
              <TicketCard key={t.id} ticket={t} onClick={() => dispatch(fetchTicket(t.id))} />
            ))}
          </div>
        )}

        {detail && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 style={{ flex: 1, margin: 0 }}>{detail.folio} · {detail.title}</h2>
              <button className="btn-ghost" onClick={() => dispatch(clearDetail())}>Cerrar</button>
            </div>
            <p className="meta">
              {detail.area} · <span className={`badge sev-${detail.severity}`}>{detail.severity}</span> · estado: <strong>{detail.status}</strong>
            </p>
            <p>{detail.description}</p>

            {(detail.images || []).length > 0 && (
              <div className="photo-gallery">
                {detail.images.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`Foto ${i + 1} del reporte`} />
                  </a>
                ))}
              </div>
            )}

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
