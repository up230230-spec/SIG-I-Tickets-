/**
 * Módulo D — Panel global (Equipo de Operaciones).
 * Vista global de tickets con agregados, mapa de calor por área, últimos
 * reportes y exportación de reportes CSV/PDF. Refresco automático cada 60s.
 */
import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import Navbar from '../components/Navbar';

// Descarga un reporte autenticado (adjunta el JWT y fuerza la descarga del blob).
const downloadReport = async (format) => {
  const token = localStorage.getItem('sigi_token');
  const res = await fetch(`${api.BASE_URL}/dashboard/reports/tickets.${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return alert('No se pudo generar el reporte.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sigi-tickets.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function GlobalPanel() {
  const [data, setData] = useState(null);
  const [heat, setHeat] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [g, h] = await Promise.all([
        api.get('/dashboard/global'),
        api.get('/dashboard/heatmap'),
      ]);
      setData(g);
      setHeat(h);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // refresco automático
    return () => clearInterval(id);
  }, [load]);

  const maxOpen = Math.max(1, ...heat.map((c) => c.open));

  return (
    <>
      <Navbar />
      <section className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ flex: 1 }}>Panel global de operaciones</h1>
          <button className="btn-ghost" onClick={() => downloadReport('csv')}>Exportar CSV</button>
          <button className="btn-ghost" onClick={() => downloadReport('pdf')}>Exportar PDF</button>
        </div>

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
          </>
        )}
      </section>
    </>
  );
}
