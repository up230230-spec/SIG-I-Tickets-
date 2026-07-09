/**
 * Gestión de áreas operativas (catálogo persistente y asignación de admins).
 *
 * Administración reservada a Operaciones (ver areaRoutes.js). El catálogo de
 * tipos de incidencia (INC-###) es de solo lectura para cualquier autenticado
 * y sirve al formulario de reporte del frontend.
 */
const Area = require('../models/Area');
const User = require('../models/User');
const { INCIDENT_TYPES } = require('../config/incidentCatalog');
const { recordAudit } = require('../middleware/audit');

// Vista serializable de un área (con admins poblados si existen).
const areaView = (a) => ({
  id: a._id,
  name: a.name,
  description: a.description,
  color: a.color,
  isActive: a.isActive,
  admins: (a.admins || []).map((u) =>
    u && u.name ? { id: u._id, name: u.name, email: u.email } : u
  ),
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

// GET /api/areas — listar áreas (con sus administradores).
exports.listAreas = async (req, res, next) => {
  try {
    const areas = await Area.find()
      .populate('admins', 'name email')
      .sort({ name: 1 });
    return res.json(areas.map(areaView));
  } catch (err) {
    next(err);
  }
};

// POST /api/areas — crear área (solo Operaciones).
exports.createArea = async (req, res, next) => {
  try {
    const { name, description, color, admins } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre del área es obligatorio.' });
    }

    const exists = await Area.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ message: 'Ya existe un área con ese nombre.' });
    }

    const area = await Area.create({
      name: name.trim(),
      description: description || '',
      color: color || '#888888',
      admins: Array.isArray(admins) ? admins : [],
    });

    await recordAudit(req, 'area.create', 'Area', area._id, { name: area.name });
    await area.populate('admins', 'name email');
    return res.status(201).json(areaView(area));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/areas/:id — actualizar área / asignar admins (solo Operaciones).
exports.updateArea = async (req, res, next) => {
  try {
    const { description, color, isActive, admins } = req.body;

    const area = await Area.findById(req.params.id);
    if (!area) return res.status(404).json({ message: 'Área no encontrada.' });

    if (description !== undefined) area.description = description;
    if (color !== undefined) area.color = color;
    if (isActive !== undefined) area.isActive = isActive;

    // Validar que los admins existan antes de asignarlos.
    if (admins !== undefined) {
      const list = Array.isArray(admins) ? admins : [];
      if (list.length) {
        const found = await User.countDocuments({ _id: { $in: list } });
        if (found !== list.length) {
          return res.status(400).json({ message: 'Alguno de los administradores no existe.' });
        }
      }
      area.admins = list;
    }

    await area.save();
    await recordAudit(req, 'area.update', 'Area', area._id, { name: area.name });
    await area.populate('admins', 'name email');
    return res.json(areaView(area));
  } catch (err) {
    next(err);
  }
};

// GET /api/areas/catalog — catálogo INC (tipos de incidencia) para el formulario.
exports.getCatalog = async (req, res) => {
  const catalog = Object.entries(INCIDENT_TYPES).map(([code, t]) => ({
    code,
    label: t.label,
    area: t.area,
    severity: t.severity,
  }));
  return res.json(catalog);
};
