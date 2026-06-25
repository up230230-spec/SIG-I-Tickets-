/**
 * Catálogo de tipos de incidencia de SIG-I.
 *
 * Cada tipo define el área responsable y la severidad por defecto, lo que
 * permite la ASIGNACIÓN AUTOMÁTICA al crear un ticket (Módulo B).
 * Las severidades CRÍTICAS disparan alerta masiva inmediata (≤10s).
 */

const AREAS = {
  TI: 'TI',
  MANTENIMIENTO: 'Mantenimiento',
  SEGURIDAD: 'Seguridad',
  SIN_DEFINIR: 'Sin definir', // Para INC-013 (Otro), se evalúa manualmente
};

const SEVERITY = {
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica',
};

// code -> { label, area, severity }
const INCIDENT_TYPES = {
  'INC-001': { label: 'Red lenta / Sin internet', area: AREAS.TI, severity: SEVERITY.MEDIA },
  'INC-002': { label: 'Falla eléctrica / Sin luz', area: AREAS.MANTENIMIENTO, severity: SEVERITY.ALTA },
  'INC-003': { label: 'Sin agua en sanitarios', area: AREAS.MANTENIMIENTO, severity: SEVERITY.MEDIA },
  'INC-004': { label: 'Incendio / Conato de incendio', area: AREAS.SEGURIDAD, severity: SEVERITY.CRITICA },
  'INC-006': { label: 'Goteras / Daño en infraestructura', area: AREAS.MANTENIMIENTO, severity: SEVERITY.ALTA },
  'INC-007': { label: 'Aire acondicionado / Calefacción', area: AREAS.MANTENIMIENTO, severity: SEVERITY.MEDIA },
  'INC-008': { label: 'Acceso no autorizado', area: AREAS.SEGURIDAD, severity: SEVERITY.CRITICA },
  'INC-009': { label: 'Elevadores / Escaleras fuera de servicio', area: AREAS.MANTENIMIENTO, severity: SEVERITY.ALTA },
  'INC-010': { label: 'Incidencia médica / Lesión', area: AREAS.SEGURIDAD, severity: SEVERITY.CRITICA },
  'INC-012': { label: 'Vandalismo / Daño a instalaciones', area: AREAS.SEGURIDAD, severity: SEVERITY.ALTA },
  'INC-013': { label: 'Otro (descripción libre)', area: AREAS.SIN_DEFINIR, severity: SEVERITY.MEDIA },
};

/** Resuelve área y severidad por defecto a partir del código de incidencia. */
const resolveIncidentType = (code) => INCIDENT_TYPES[code] || null;

module.exports = { AREAS, SEVERITY, INCIDENT_TYPES, resolveIncidentType };
