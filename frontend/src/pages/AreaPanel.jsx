/**
 * Módulo C — Panel de gestión por área (Administrador de Área / Operaciones).
 * Lista los tickets del área con filtros por estado/severidad/área, código de
 * color por tipo, y permite avanzar el flujo de estados (con comentario) y
 * reasignar (con nota de motivo). Estado gestionado con Redux (slice `tickets`).
 */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { fetchTickets, updateStatus, reassignTicket } from '../store/ticketsSlice';
import { accentFor, INCIDENT_TYPES } from '../config/incidentTypes';
import Navbar from '../components/Navbar';

const STATUSES = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
const SEVERITIES = ['critica', 'alta', 'media'];
// Áreas = tipo de mantenimiento responsable de cada incidencia.
const AREAS = ['TI', 'Mantenimiento', 'Seguridad'];

// Siguiente estado sugerido en el flujo unidireccional.
const NEXT = { abierto: 'en_proceso', en_proceso: 'resuelto', resuelto: 'cerrado' };

export default function AreaPanel() {
  const { user } = useAuth();
  // Operaciones ve todos los tickets y puede filtrar por área; el admin de área
  // solo ve los de su área (el backend lo restringe aunque se envíe el filtro).
  const isOps = user.role === 'operaciones';

  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((s) => s.tickets);
  const [filters, setFilters] = useState({ status: '', severity: '', area: '' });

  const load = () => dispatch(fetchTickets(filters));
  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = async (t) => {
    const to = NEXT[t.status];
    if (!to) return;
    const comment = window.prompt(`Comentario para cambiar "${t.folio}" a "${to}":`);
    if (!comment) return;
    try { await dispatch(updateStatus({ id: t.id, status: to, comment })).unwrap(); load(); }
    catch (err) { alert(err); }
  };

  const reassign = async (t) => {
    const assignedTo = window.prompt(`ID del usuario destino para "${t.folio}":`);
    if (!assignedTo) return;
    const reason = window.prompt('Motivo de la reasignación:');
    if (!reason) return;
    try { await dispatch(reassignTicket({ id: t.id, assignedTo, reason })).unwrap(); load(); }
    catch (err) { alert(err); }
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
                {list.map((t) => (
                  <tr key={t.id}>
                    <td style={{ borderLeft: `6px solid ${accentFor(t.incidentCode)}` }}>{t.folio}</td>
                    <td>{t.area}</td>
                    <td>{INCIDENT_TYPES[t.incidentCode]?.label || t.incidentCode}</td>
                    <td>{t.title}</td>
                    <td><span className={`badge sev-${t.severity}`}>{t.severity}</span></td>
                    <td>{t.status}</td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      {NEXT[t.status] && (
                        <button className="btn-primary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => advance(t)}>
                          → {NEXT[t.status]}
                        </button>
                      )}
                      <button className="btn-ghost" style={{ padding: '0.35rem 0.6rem' }} onClick={() => reassign(t)}>
                        Reasignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
