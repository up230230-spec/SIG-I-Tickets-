/**
 * Paletas de las gráficas, asignadas por la FUNCIÓN del color (no por estética):
 *
 *  - STATUS  → estado del ticket (paleta de "estado": inactivo=gris, etc.).
 *  - SEVERITY→ severidad (crítica/alta/media). Validada con el script de dataviz
 *    (rojo/ámbar/azul: separación CVD y de visión normal por encima del umbral).
 *  - AREA    → identidad de cada área (coincide con el color sembrado en la BD,
 *    para que el mapa de calor y las gráficas usen el mismo código de color).
 *
 * Todas las gráficas muestran SIEMPRE etiquetas/leyenda + valor, de modo que la
 * identidad nunca depende solo del color (requisito de accesibilidad).
 */
export const STATUS_COLORS = {
  abierto: '#f59e0b',    // ámbar — pendiente de atención
  en_proceso: '#2563eb', // azul — en curso
  resuelto: '#16a34a',   // verde — resuelto
  cerrado: '#64748b',    // gris — inactivo/cerrado
};

export const STATUS_LABELS = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

export const SEVERITY_COLORS = {
  critica: '#dc2626', // rojo
  alta: '#f59e0b',    // ámbar
  media: '#2563eb',   // azul
};

export const AREA_COLORS = {
  TI: '#2563eb',
  Mantenimiento: '#d97706',
  Seguridad: '#dc2626',
  sin_definir: '#94a3b8',
};

// Color por defecto para categorías no previstas.
export const FALLBACK_COLOR = '#94a3b8';
