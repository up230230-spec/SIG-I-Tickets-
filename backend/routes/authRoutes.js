const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/roles');

// Públicas.
router.post('/register', ctrl.register);
router.get('/verify/:token', ctrl.verifyEmail);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);

// Protegidas.
router.get('/me', protect, ctrl.me);
router.patch(
  '/users/:id/role',
  protect,
  requirePermission(PERMISSIONS.USER_MANAGE_ROLES),
  ctrl.updateRole
);

module.exports = router;
