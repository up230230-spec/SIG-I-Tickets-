/**
 * Gestión de áreas operativas (catálogo persistente y asignación de admins).
 *
 * STUB: contrato de endpoints (administración — Operaciones).
 */
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ message: `TODO: implementar ${name}` });

// GET /api/areas — listar áreas.
exports.listAreas = notImplemented('listAreas');

// POST /api/areas — crear área.
exports.createArea = notImplemented('createArea');

// PATCH /api/areas/:id — actualizar área / asignar admins.
exports.updateArea = notImplemented('updateArea');

// GET /api/areas/catalog — devolver el catálogo INC (tipos de incidencia).
exports.getCatalog = notImplemented('getCatalog');
