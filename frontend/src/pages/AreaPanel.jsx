/**
 * Módulo C — Panel de gestión por área (Administrador de Área / Operaciones).
 * Lista los tickets del área con filtros por estado/severidad, código de color
 * por tipo, y permite avanzar el flujo de estados (con comentario obligatorio)
 * y reasignar (con nota de motivo).
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { accentFor, INCIDENT_TYPES } from '../config/incidentTypes';
import Navbar from '../components/Navbar';

const STATUSES = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
const SEVERITIES = ['critica', 'alta', 'media'];

// Siguiente estado sugerido en el flujo unidireccional.
const NEXT = { abierto: 'en_proceso', en_proceso: 'resuelto', resuelto: 'cerrado' };

export default function AreaPanel() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: '', severity: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      ).toString();
      setTickets(await api.get(`/tickets${qs ? `?${qs}` : ''}`));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const advance = async (t) => {
    const to = NEXT[t.status];
    if (!to) return;
    const comment = window.prompt(`Comentario para cambiar "${t.folio}" a "${to}":`);
    if (!comment) return;
    try {
      await api.patch(`/tickets/${t.id}/status`, { status: to, comment });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const reassign = async (t) => {
    const assignedTo = window.prompt(`ID del usuario destino para "${t.folio}":`);
    if (!assignedTo) return;
    const reason = window.prompt('Motivo de la reasignación:');
    if (!reason) return;
    try {
      await api.patch(`/tickets/${t.id}/reassign`, { assignedTo, reason });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <section className="page">
        <h1>Panel de área</h1>

        <div className="toolbar">
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
        ) : tickets.length === 0 ? (
          <p className="empty">No hay tickets con esos filtros.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Folio</th><th>Tipo</th><th>Título</th><th>Sev.</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ borderLeft: `6px solid ${accentFor(t.incidentCode)}` }}>{t.folio}</td>
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
        )}
      </section>
    </>
  );
}
