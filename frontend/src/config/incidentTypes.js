/**
 * Catálogo de tipos de incidencia para el frontend.
 * Debe mantenerse alineado con backend/config/incidentCatalog.js.
 *
 * `accent` es el color de la LÍNEA DE ORILLA (borde izquierdo) de cada tarjeta,
 * usado para distinguir el tipo de un vistazo. La paleta general de la app es
 * azul; estos acentos son los únicos toques de color por tipo.
 */
export const INCIDENT_TYPES = {
  'INC-001': { label: 'Red lenta / Sin internet', area: 'TI', accent: '#2563eb' },          // azul
  'INC-002': { label: 'Falla eléctrica / Sin luz', area: 'Mantenimiento', accent: '#f59e0b' }, // ámbar
  'INC-003': { label: 'Sin agua en sanitarios', area: 'Mantenimiento', accent: '#06b6d4' },   // cian
  'INC-004': { label: 'Incendio / Conato de incendio', area: 'Seguridad', accent: '#dc2626' }, // rojo (crítico)
  'INC-006': { label: 'Goteras / Daño infraestructura', area: 'Mantenimiento', accent: '#0ea5e9' }, // celeste
  'INC-007': { label: 'Aire acondicionado / Calefacción', area: 'Mantenimiento', accent: '#14b8a6' }, // teal
  'INC-008': { label: 'Acceso no autorizado', area: 'Seguridad', accent: '#7c3aed' },         // morado
  'INC-009': { label: 'Elevadores / Escaleras', area: 'Mantenimiento', accent: '#64748b' },   // gris azulado
  'INC-010': { label: 'Incidencia médica / Lesión', area: 'Seguridad', accent: '#e11d48' },   // rosa fuerte (crítico)
  'INC-012': { label: 'Vandalismo / Daño', area: 'Seguridad', accent: '#ea580c' },            // naranja
  'INC-013': { label: 'Otro', area: 'Sin definir', accent: '#94a3b8' },                       // gris
};

/** Color de orilla para un código de incidencia (con respaldo neutro). */
export const accentFor = (code) => (INCIDENT_TYPES[code]?.accent) || '#94a3b8';
