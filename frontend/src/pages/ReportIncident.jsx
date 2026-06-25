import { INCIDENT_TYPES } from '../config/incidentTypes';

/**
 * Módulo B — Reporte de incidencia.
 * STUB: muestra el catálogo de tipos. Cada opción se asociará a su color de orilla.
 * El formulario final tendrá: tipo, ubicación, descripción y hasta 3 imágenes.
 */
export default function ReportIncident() {
  return (
    <section className="page">
      <h1>Reportar incidencia</h1>
      <p className="meta">TODO: formulario (tipo, ubicación, descripción, imágenes).</p>
      <ul>
        {Object.entries(INCIDENT_TYPES).map(([code, t]) => (
          <li key={code} style={{ borderLeft: `6px solid ${t.accent}`, paddingLeft: 8, margin: '4px 0' }}>
            {code} — {t.label} ({t.area})
          </li>
        ))}
      </ul>
    </section>
  );
}
