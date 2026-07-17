/**
 * Módulo D — Panel global (Equipo de Operaciones).
 * Agregados, mapa de calor por área, últimos reportes y exportación CSV/PDF.
 * Refresco automático cada 60s. Estado gestionado con Redux (slice `dashboard`).
 */
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGlobal, fetchHeatmap } from '../store/dashboardSlice';
import { api } from '../api/client';
import useAutoRefresh from '../hooks/useAutoRefresh';
import useSocketAlerts from '../hooks/useSocketAlerts';
import Navbar from '../components/Navbar';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { STATUS_COLORS, STATUS_LABELS, SEVERITY_COLORS } from '../config/chartColors';

// Descarga un reporte autenticado. El JWT lo adjunta el interceptor de Axios;
// aquí solo forzamos la descarga del blob recibido.
const downloadReport = async (format) => {
  try {
    const blob = await api.download(`/dashboard/reports/tickets.${format}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigi-tickets.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert('No se pudo generar el reporte.');
  }
};

export default function GlobalPanel() {
  const dispatch = useDispatch();
  const { global: data, heatmap: heat, error } = useSelector((s) => s.dashboard);

  // Refresco automático cada 60s mediante hook personalizado reutilizable.
  const load = useCallback(() => {
    dispatch(fetchGlobal());
    dispatch(fetchHeatmap());
  }, [dispatch]);
  useAutoRefresh(load, 60000);

  // Alertas críticas en tiempo real (Socket.io) mediante hook personalizado.
  const { latest: alert, clear: clearAlert } = useSocketAlerts();

  const maxOpen = Math.max(1, ...heat.map((c) => c.open));

  // Datos para las gráficas (orden fijo de estados y severidades).
  const statusData = data
    ? ['abierto', 'en_proceso', 'resuelto', 'cerrado'].map((s) => ({
        label: STATUS_LABELS[s], value: data.byStatus[s] || 0, color: STATUS_COLORS[s],
      }))
    : [];
  const severityData = data
    ? ['critica', 'alta', 'media'].map((s) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1), value: data.bySeverity[s] || 0, color: SEVERITY_COLORS[s],
      }))
    : [];

  return (
    <>
      <Navbar />
      <section className="page">
        <div className="page-head">
          <h1>Panel global de operaciones</h1>
          <button className="btn-ghost" onClick={() => downloadReport('csv')}>Exportar CSV</button>
          <button className="btn-ghost" onClick={() => downloadReport('pdf')}>Exportar PDF</button>
        </div>

        {alert && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ flex: 1 }}>🚨 Alerta crítica: <strong>{alert.title}</strong> · {alert.area} ({alert.severity})</span>
            <button className="btn-ghost" onClick={clearAlert}>Descartar</button>
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}
        {!data ? (
          <p className="meta">Cargando…</p>
        ) : (
          <>
            <div className="grid cols-4">
              <div className="card stat-card"><div className="value">{data.total}</div><div className="label">Total</div></div>
              <div className="card stat-card"><div className="value">{data.byStatus.abierto + data.byStatus.en_proceso}</div><div className="label">Abiertos / en proceso</div></div>
              <div className="card stat-card"><div className="value" style={{ color: '#b91c1c' }}>{data.activeEmergencies}</div><div className="label">Emergencias activas</div></div>
              <div className="card stat-card"><div className="value">{data.escalated}</div><div className="label">Escalados (48h)</div></div>
            </div>

            <div className="grid cols-2" style={{ marginTop: '1.5rem' }}>
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Tickets por estado</h2>
                <DonutChart data={statusData} unit="tickets" />
              </div>
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Tickets por severidad</h2>
                <BarChart data={severityData} />
              </div>
            </div>

            <h2 style={{ color: 'var(--blue-900)' }}>Mapa de calor por área</h2>
            <div className="card">
              {heat.map((c) => (
                <div className="heat-row" key={c.area}>
                  <span className="name">{c.area}</span>
                  <div className="heat-track">
                    <div className="heat-fill" style={{ width: `${(c.open / maxOpen) * 100}%`, background: c.color }} />
                  </div>
                  <span className="meta">{c.open} abiertos{c.critical ? ` · ${c.critical} críticos` : ''}</span>
                </div>
              ))}
            </div>

            <h2 style={{ color: 'var(--blue-900)' }}>Últimos reportes</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Folio</th><th>Título</th><th>Área</th><th>Sev.</th><th>Estado</th></tr></thead>
                <tbody>
                  {data.recent.map((t) => (
                    <tr key={t.id}>
                      <td>{t.folio}</td>
                      <td>{t.isEmergency ? '🚨 ' : ''}{t.title}</td>
                      <td>{t.area}</td>
                      <td><span className={`badge sev-${t.severity}`}>{t.severity}</span></td>
                      <td>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
