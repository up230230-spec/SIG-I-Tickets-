const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const reportCtrl = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/roles');

router.use(protect);

router.get('/global', requirePermission(PERMISSIONS.DASHBOARD_GLOBAL), ctrl.global);
router.get('/heatmap', requirePermission(PERMISSIONS.DASHBOARD_GLOBAL), ctrl.heatmap);
router.get('/executive', requirePermission(PERMISSIONS.DASHBOARD_EXEC), ctrl.executive);

// Reportes exportables.
router.get('/reports/tickets.csv', requirePermission(PERMISSIONS.REPORT_EXPORT), reportCtrl.exportCsv);
router.get('/reports/tickets.pdf', requirePermission(PERMISSIONS.REPORT_EXPORT), reportCtrl.exportPdf);

module.exports = router;
