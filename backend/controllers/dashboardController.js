/**
 * Módulo D (parcial) — Datos para paneles y dashboards.
 *
 * STUB: contrato de endpoints.
 *  - global: vista de todos los tickets + agregados (para Operaciones).
 *  - heatmap: conteo por área para el mapa de calor.
 *  - executive: KPIs para el Rector (SLA, tiempos de respuesta, volumen).
 */
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ message: `TODO: implementar ${name}` });

// GET /api/dashboard/global — vista global (Operaciones).
exports.global = notImplemented('global');

// GET /api/dashboard/heatmap — mapa de calor por área.
exports.heatmap = notImplemented('heatmap');

// GET /api/dashboard/executive — KPIs ejecutivos (Rector).
exports.executive = notImplemented('executive');
