/**
 * Mi actividad — dashboard personal disponible para CUALQUIER rol.
 *
 * Reúne todo lo que el usuario ha hecho en la plataforma: tickets reportados
 * (por estado), comentarios, hilos y respuestas del foro y —para roles de
 * gestión— tickets asignados y cambios de estado aplicados. Además muestra una
 * línea de tiempo unificada con su actividad reciente.
 *
 * Los datos se obtienen con el hook personalizado `useActivity` (GET
 * /dashboard/me), que expone los estados de carga/error y un `reload()`.
 */
import useActivity from '../hooks/useActivity';
import Navbar from '../components/Navbar';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import { STATUS_COLORS, STATUS_LABELS } from '../config/chartColors';

// Etiquetas legibles para los roles.
const ROLE_LABEL = {
  usuario_general: 'Usuario general',
  jefe_carrera: 'Jefe de carrera',
  admin_area: 'Administrador de área',
  operaciones: 'Operaciones',
  rector: 'Rector',
};

// Formatea una fecha ISO a un formato corto en español.
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// Ícono por tipo de evento en la línea de tiempo.
const TIMELINE_ICON = { ticket: '🎫', forum_post: '💬' };

export default function MyActivity() {
  const { data, loading, error, reload } = useActivity();

  return (
    <>
      <Navbar />
      <section className="page">
        <div className="page-head">
          <h1>Mi actividad</h1>
          <button className="btn-ghost" onClick={reload} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && !data ? (
          <p className="meta">Cargando tu actividad…</p>
        ) : !data ? (
          <p className="empty">No se pudo cargar tu actividad.</p>
        ) : (
          <>
            <p className="meta">
              {data.user.name} · {ROLE_LABEL[data.user.role] || data.user.role}
              {data.memberSince && <> · miembro desde {fmtDate(data.memberSince)}</>}
            </p>

            {/* --- KPIs principales --- */}
            <div className="grid cols-4">
              <div className="card stat-card">
                <div className="value">{data.tickets.reported}</div>
                <div className="label">Reportes creados</div>
              </div>
              <div className="card stat-card">
                <div className="value">{data.comments}</div>
                <div className="label">Comentarios</div>
              </div>
              <div className="card stat-card">
                <div className="value">{data.forum.posts}</div>
                <div className="label">Hilos en el foro</div>
              </div>
              <div className="card stat-card">
                <div className="value">{data.forum.replies}</div>
                <div className="label">
                  Respuestas{data.forum.officialReplies ? ` · ${data.forum.officialReplies} oficiales` : ''}
                </div>
              </div>
            </div>

            {/* --- KPIs de gestión (solo roles que gestionan tickets) --- */}
            {data.management && (
              <>
                <h2 style={{ color: 'var(--blue-900)' }}>Gestión de tickets</h2>
                <div className="grid cols-3">
                  <div className="card stat-card">
                    <div className="value">{data.management.assigned}</div>
                    <div className="label">Asignados a mí</div>
                  </div>
                  <div className="card stat-card">
                    <div className="value">{data.management.resolved}</div>
                    <div className="label">Resueltos / cerrados</div>
                  </div>
                  <div className="card stat-card">
                    <div className="value">{data.management.statusChanges}</div>
                    <div className="label">Cambios de estado</div>
                  </div>
                </div>
              </>
            )}

            {/* --- Gráficas: reportes por estado + resumen de actividad --- */}
            <div className="grid cols-2">
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Mis reportes por estado</h2>
                {data.tickets.reported === 0 ? (
                  <p className="meta">Aún no has reportado incidencias.</p>
                ) : (
                  <DonutChart
                    data={['abierto', 'en_proceso', 'resuelto', 'cerrado'].map((s) => ({
                      label: STATUS_LABELS[s], value: data.tickets.byStatus[s] || 0, color: STATUS_COLORS[s],
                    }))}
                    unit="reportes"
                  />
                )}
              </div>
              <div className="card">
                <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Resumen de mi actividad</h2>
                <BarChart
                  data={[
                    { label: 'Reportes', value: data.tickets.reported, color: 'var(--blue-600)' },
                    { label: 'Comentarios', value: data.comments, color: 'var(--blue-600)' },
                    { label: 'Hilos foro', value: data.forum.posts, color: 'var(--blue-600)' },
                    { label: 'Respuestas', value: data.forum.replies, color: 'var(--blue-600)' },
                  ]}
                />
              </div>
            </div>

            {/* --- Línea de tiempo unificada --- */}
            <h2 style={{ color: 'var(--blue-900)' }}>Actividad reciente</h2>
            <div className="card">
              {data.timeline.length === 0 ? (
                <p className="meta">Sin actividad reciente.</p>
              ) : (
                data.timeline.map((ev, i) => (
                  <div key={i} className="heat-row" style={{ alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.1rem' }}>{TIMELINE_ICON[ev.type] || '•'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--blue-800)' }}>
                        {ev.emergency ? '🚨 ' : ''}{ev.title}
                        {ev.severity && <span className={`badge sev-${ev.severity}`} style={{ marginLeft: '0.5rem' }}>{ev.severity}</span>}
                      </div>
                      <div className="meta">{ev.meta}</div>
                    </div>
                    <span className="meta">{fmtDate(ev.at)}</span>
                  </div>
                ))
              )}
            </div>

            {/* --- Últimos hilos del foro --- */}
            {data.forum.recent.length > 0 && (
              <>
                <h2 style={{ color: 'var(--blue-900)' }}>Mis hilos en el foro</h2>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Título</th><th>Categoría</th><th>Estado</th><th>Fecha</th></tr></thead>
                    <tbody>
                      {data.forum.recent.map((p) => (
                        <tr key={p.id}>
                          <td>{p.title}</td>
                          <td>{p.category}</td>
                          <td>{p.pinned ? '📌 fijado' : ''}{p.closed ? ' 🔒 cerrado' : ''}{!p.pinned && !p.closed ? 'abierto' : ''}</td>
                          <td>{fmtDate(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
