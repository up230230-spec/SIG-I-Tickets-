/**
 * Módulo D — Dashboard ejecutivo (Rector, solo lectura).
 * KPIs institucionales: cumplimiento de SLA, tiempo medio de resolución,
 * backlog abierto y volumen por área/severidad.
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Navbar from '../components/Navbar';

export default function ExecutiveDashboard() {
  const [k, setK] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/executive').then(setK).catch((err) => setError(err.message));
  }, []);

  const slaColor = k
    ? k.slaCompliance >= 90 ? '#15803d' : k.slaCompliance >= 70 ? '#c2410c' : '#b91c1c'
    : undefined;

  return (
    <>
      <Navbar />
      <section className="page">
        <h1>Dashboard ejecutivo</h1>
        {error && <div className="alert alert-error">{error}</div>}
        {!k ? (
          <p className="meta">Cargando…</p>
        ) : (
          <>
            <div className="grid cols-4">
              <div className="card stat-card">
                <div className="value" style={{ color: slaColor }}>{k.slaCompliance}%</div>
                <div className="label">Cumplimiento de SLA</div>
              </div>
              <div className="card stat-card"><div className="value">{k.avgResolutionHours}h</div><div className="label">Tiempo medio de resolución</div></div>
              <div className="card stat-card"><div className="value">{k.openBacklog}</div><div className="label">Backlog abierto</div></div>
              <div className="card stat-card"><div className="value">{k.resolved}</div><div className="label">Resueltos (histórico)</div></div>
            </div>

            <div className="grid cols-2" style={{ marginTop: '1.5rem' }}>
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Volumen por área</h2>
                {Object.entries(k.volumeByArea).map(([area, n]) => (
                  <div className="heat-row" key={area}>
                    <span className="name">{area}</span>
                    <div className="heat-track">
                      <div className="heat-fill" style={{
                        width: `${(n / Math.max(1, ...Object.values(k.volumeByArea))) * 100}%`,
                        background: 'var(--blue-500)',
                      }} />
                    </div>
                    <span className="meta">{n}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Volumen por severidad</h2>
                {Object.entries(k.volumeBySeverity).map(([sev, n]) => (
                  <div className="heat-row" key={sev}>
                    <span className="name"><span className={`badge sev-${sev}`}>{sev}</span></span>
                    <div className="heat-track">
                      <div className="heat-fill" style={{
                        width: `${(n / Math.max(1, ...Object.values(k.volumeBySeverity))) * 100}%`,
                        background: 'var(--blue-500)',
                      }} />
                    </div>
                    <span className="meta">{n}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="meta" style={{ marginTop: '1rem' }}>
              Objetivos SLA (horas hasta resolución): crítica {k.slaTargets.critica}h ·
              alta {k.slaTargets.alta}h · media {k.slaTargets.media}h.
            </p>
          </>
        )}
      </section>
    </>
  );
}
