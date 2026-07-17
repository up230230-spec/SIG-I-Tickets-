/**
 * Gráfica de dona (SVG, sin dependencias).
 *
 * Representa la distribución de una magnitud entre categorías. Cada segmento se
 * dibuja con `stroke-dasharray` sobre un círculo (robusto incluso con un único
 * segmento al 100%). Incluye total al centro, leyenda con valor y porcentaje, y
 * un `<title>` por segmento para tooltip nativo.
 *
 * props:
 *   data  = [{ label, value, color }]
 *   total = número al centro (por defecto, la suma de los valores)
 *   unit  = etiqueta bajo el total (p. ej. "tickets")
 */
const RADIUS = 60;
const STROKE = 26;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 2; // separación entre segmentos (unidades SVG)

export default function DonutChart({ data = [], total, unit = '' }) {
  const items = data.filter((d) => d.value > 0);
  const sum = items.reduce((a, b) => a + b.value, 0);
  const centerValue = total != null ? total : sum;

  let offset = 0;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
      <svg viewBox="0 0 160 160" width="160" height="160" role="img" style={{ flexShrink: 0 }}>
        {/* Pista de fondo */}
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--blue-50)" strokeWidth={STROKE} />
        {sum === 0 ? (
          <text x="80" y="84" textAnchor="middle" fontSize="12" fill="var(--text-muted)">Sin datos</text>
        ) : (
          <>
            {items.map((d) => {
              const frac = d.value / sum;
              const dash = frac * CIRC;
              const seg = (
                <circle
                  key={d.label}
                  cx="80" cy="80" r={RADIUS} fill="none"
                  stroke={d.color} strokeWidth={STROKE}
                  strokeDasharray={`${Math.max(0, dash - GAP)} ${CIRC - Math.max(0, dash - GAP)}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                >
                  <title>{d.label}: {d.value} ({Math.round(frac * 100)}%)</title>
                </circle>
              );
              offset += dash;
              return seg;
            })}
            <text x="80" y="76" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--blue-800)">
              {centerValue}
            </text>
            {unit && (
              <text x="80" y="94" textAnchor="middle" fontSize="11" fill="var(--text-muted)">{unit}</text>
            )}
          </>
        )}
      </svg>

      {/* Leyenda con valor + porcentaje (identidad nunca solo por color) */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '.45rem', minWidth: 160 }}>
        {data.map((d) => {
          const pct = sum ? Math.round((d.value / sum) * 100) : 0;
          return (
            <li key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--text)' }}>{d.label}</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--blue-800)' }}>{d.value}</strong>
              <span style={{ color: 'var(--text-muted)', width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
