const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/areaController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/roles');

// Catálogo de tipos de incidencia (lectura para cualquier usuario autenticado).
router.get('/catalog', protect, ctrl.getCatalog);

// Administración de áreas (solo Operaciones).
router.get('/', protect, ctrl.listAreas);
router.post('/', protect, requireRole(ROLES.OPERACIONES), ctrl.createArea);
router.patch('/:id', protect, requireRole(ROLES.OPERACIONES), ctrl.updateArea);

module.exports = router;
