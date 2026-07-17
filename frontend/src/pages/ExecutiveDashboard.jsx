/**
 * Módulo D — Dashboard ejecutivo (Rector, solo lectura).
 * KPIs institucionales: cumplimiento de SLA, tiempo medio de resolución,
 * backlog abierto y volumen por área/severidad. Estado con Redux (`dashboard`).
 */
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchExecutive } from '../store/dashboardSlice';
import Navbar from '../components/Navbar';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { SEVERITY_COLORS, AREA_COLORS, FALLBACK_COLOR } from '../config/chartColors';

export default function ExecutiveDashboard() {
  const dispatch = useDispatch();
  const { executive: k, error } = useSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchExecutive()); }, [dispatch]);

  const slaColor = k
    ? k.slaCompliance >= 90 ? '#15803d' : k.slaCompliance >= 70 ? '#c2410c' : '#b91c1c'
    : undefined;

  // Prepara los datos para las gráficas (orden fijo de severidad).
  const severityData = k
    ? ['critica', 'alta', 'media'].map((s) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1),
        value: k.volumeBySeverity[s] || 0,
        color: SEVERITY_COLORS[s],
      }))
    : [];
  const areaData = k
    ? Object.entries(k.volumeByArea)
        .filter(([a]) => a !== 'sin_definir')
        .map(([a, n]) => ({ label: a, value: n, color: AREA_COLORS[a] || FALLBACK_COLOR }))
        .sort((x, y) => y.value - x.value)
    : [];

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
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Distribución por severidad</h2>
                <DonutChart data={severityData} unit="tickets" />
              </div>
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Volumen por área</h2>
                <BarChart data={areaData} />
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
