/**
 * Gráfica de barras horizontales (sin dependencias).
 *
 * Ideal para comparar magnitudes entre categorías (volumen por área/severidad).
 * Barras finas con extremo redondeado ancladas a una línea base común, etiqueta
 * de categoría a la izquierda y valor a la derecha. Cada barra lleva `title`
 * para tooltip nativo.
 *
 * props:
 *   data = [{ label, value, color }]
 *   max  = valor de referencia para el 100% (por defecto, el mayor del set)
 */
export default function BarChart({ data = [], max }) {
  const top = max != null ? max : Math.max(1, ...data.map((d) => d.value));

  return (
    <div style={{ display: 'grid', gap: '.7rem' }}>
      {data.map((d) => {
        const pct = Math.max(d.value > 0 ? 3 : 0, (d.value / top) * 100); // mínimo visible
        return (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <span style={{ width: 108, flexShrink: 0, fontSize: '.85rem', fontWeight: 600, color: 'var(--blue-800)' }}>
              {d.label}
            </span>
            <div
              title={`${d.label}: ${d.value}`}
              style={{ flex: 1, height: 16, background: 'var(--blue-50)', borderRadius: 6, overflow: 'hidden' }}
            >
              <div style={{
                width: `${pct}%`, height: '100%', background: d.color,
                borderRadius: 6, transition: 'width .4s ease',
              }} />
            </div>
            <span style={{ width: 34, textAlign: 'right', fontSize: '.85rem', fontWeight: 700,
              color: 'var(--blue-800)', fontVariantNumeric: 'tabular-nums' }}>
              {d.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
