/**
 * Módulo C — Panel de gestión por área (Administrador de Área / Operaciones).
 * Lista los tickets del área con filtros por estado/severidad/área, código de
 * color por tipo, y permite avanzar el flujo de estados (con comentario) y
 * reasignar (con nota de motivo). Estado gestionado con Redux (slice `tickets`).
 */
import { Fragment, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { fetchTickets, updateStatus, reassignTicket } from '../store/ticketsSlice';
import { accentFor, INCIDENT_TYPES } from '../config/incidentTypes';
import Navbar from '../components/Navbar';

const STATUSES = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
const SEVERITIES = ['critica', 'alta', 'media'];
// Áreas = tipo de mantenimiento responsable de cada incidencia.
const AREAS = ['TI', 'Mantenimiento', 'Seguridad'];

const STATUS_LABEL = {
  abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado',
};

// Transiciones de estado permitidas según el flujo unidireccional. Operaciones
// puede además regresar de "resuelto" a "en_proceso" (reapertura).
const allowedNext = (status, isOps) => {
  const base = { abierto: ['en_proceso'], en_proceso: ['resuelto'], resuelto: ['cerrado'], cerrado: [] };
  const next = [...(base[status] || [])];
  if (isOps && status === 'resuelto') next.push('en_proceso');
  return next;
};

export default function AreaPanel() {
  const { user } = useAuth();
  // Operaciones ve todos los tickets y puede filtrar por área; el admin de área
  // solo ve los de su área (el backend lo restringe aunque se envíe el filtro).
  const isOps = user.role === 'operaciones';

  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.tickets);
  const [filters, setFilters] = useState({ status: '', severity: '', area: '' });

  // Editor inline: { id, mode: 'status'|'reassign', to } + campos del formulario.
  const [editing, setEditing] = useState(null);
  const [comment, setComment] = useState('');
  const [assign, setAssign] = useState({ assignedTo: '', reason: '' });

  const load = () => dispatch(fetchTickets(filters));
  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeEditor = () => { setEditing(null); setComment(''); setAssign({ assignedTo: '', reason: '' }); };

  // Abre el editor de cambio de estado al elegir un destino en el desplegable.
  const pickStatus = (t, to) => {
    if (!to) return;
    setComment('');
    setEditing({ id: t.id, mode: 'status', to });
  };

  const confirmStatus = async () => {
    if (!comment.trim()) return;
    try {
      await dispatch(updateStatus({ id: editing.id, status: editing.to, comment })).unwrap();
      closeEditor(); load();
    } catch (err) { alert(err); }
  };

  const confirmReassign = async () => {
    if (!assign.assignedTo.trim() || !assign.reason.trim()) return;
    try {
      await dispatch(reassignTicket({ id: editing.id, ...assign })).unwrap();
      closeEditor(); load();
    } catch (err) { alert(err); }
  };

  return (
    <>
      <Navbar />
      <section className="page">
        <h1>{isOps ? 'Todos los tickets' : 'Panel de mi área'}</h1>
        <p className="meta">
          {isOps
            ? 'Vista global de incidencias. Filtra por área (tipo de mantenimiento), estado o severidad.'
            : `Incidencias asignadas a tu área${user.area ? ` (${user.area})` : ''}.`}
        </p>

        <div className="toolbar">
          {isOps && (
            <div className="field">
              <label>Área</label>
              <select value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
                <option value="">Todas</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label>Estado</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Todos</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Severidad</label>
            <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">Todas</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn-ghost" onClick={load}>Actualizar</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <p className="meta">Cargando…</p>
        ) : list.length === 0 ? (
          <p className="empty">No hay tickets con esos filtros.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Folio</th><th>Área</th><th>Tipo</th><th>Título</th><th>Sev.</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {list.map((t) => {
                  const nexts = allowedNext(t.status, isOps);
                  const isEditing = editing?.id === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr>
                        <td style={{ borderLeft: `6px solid ${accentFor(t.incidentCode)}` }}>{t.folio}</td>
                        <td>{t.area}</td>
                        <td>{INCIDENT_TYPES[t.incidentCode]?.label || t.incidentCode}</td>
                        <td>{t.title}</td>
                        <td><span className={`badge sev-${t.severity}`}>{t.severity}</span></td>
                        <td>{STATUS_LABEL[t.status] || t.status}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {/* Desplegable para cambiar el estado (sin ventanas emergentes) */}
                            {nexts.length > 0 ? (
                              <select
                                value=""
                                onChange={(e) => pickStatus(t, e.target.value)}
                                style={{ padding: '0.35rem 0.5rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem' }}
                              >
                                <option value="">Cambiar estado…</option>
                                {nexts.map((s) => (
                                  <option key={s} value={s}>
                                    {s === 'en_proceso' && t.status === 'resuelto' ? 'Reabrir → en proceso' : `Marcar ${STATUS_LABEL[s]}`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="meta">— cerrado —</span>
                            )}
                            <button
                              className="btn-ghost"
                              style={{ padding: '0.35rem 0.6rem' }}
                              onClick={() => { closeEditor(); setEditing({ id: t.id, mode: 'reassign' }); }}
                            >
                              Reasignar
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Editor inline (estado o reasignación) */}
                      {isEditing && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--blue-50)' }}>
                            {editing.mode === 'status' ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                                <span className="meta" style={{ fontWeight: 600 }}>
                                  {t.folio}: {STATUS_LABEL[t.status]} → <strong>{STATUS_LABEL[editing.to]}</strong>. Comentario:
                                </span>
                                <input
                                  autoFocus
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && confirmStatus()}
                                  placeholder="Describe la acción o solución…"
                                  style={{ flex: 1, minWidth: 220, padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)' }}
                                />
                                <button className="btn-primary" style={{ padding: '0.45rem 0.8rem' }} disabled={!comment.trim()} onClick={confirmStatus}>Confirmar</button>
                                <button className="btn-ghost" style={{ padding: '0.45rem 0.8rem' }} onClick={closeEditor}>Cancelar</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                                <span className="meta" style={{ fontWeight: 600 }}>Reasignar {t.folio}:</span>
                                <input
                                  autoFocus
                                  value={assign.assignedTo}
                                  onChange={(e) => setAssign({ ...assign, assignedTo: e.target.value })}
                                  placeholder="ID de usuario destino"
                                  style={{ minWidth: 180, padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)' }}
                                />
                                <input
                                  value={assign.reason}
                                  onChange={(e) => setAssign({ ...assign, reason: e.target.value })}
                                  placeholder="Motivo"
                                  style={{ flex: 1, minWidth: 180, padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)' }}
                                />
                                <button className="btn-primary" style={{ padding: '0.45rem 0.8rem' }} disabled={!assign.assignedTo.trim() || !assign.reason.trim()} onClick={confirmReassign}>Reasignar</button>
                                <button className="btn-ghost" style={{ padding: '0.45rem 0.8rem' }} onClick={closeEditor}>Cancelar</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
