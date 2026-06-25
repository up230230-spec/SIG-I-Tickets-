const { roleHasPermission } = require('../config/roles');

/**
 * Middleware de control de acceso basado en roles (RBAC).
 * Debe usarse SIEMPRE después de `protect` (necesita req.user).
 *
 * Uso:
 *   router.delete('/:id', protect, requirePermission(PERMISSIONS.TICKET_DELETE), ctrl.remove)
 *   router.get('/global', protect, requireRole(ROLES.OPERACIONES), ctrl.global)
 */

const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado.' });
  const ok = permissions.every((p) => roleHasPermission(req.user.role, p));
  if (!ok) {
    return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Rol no autorizado.' });
  }
  next();
};

module.exports = { requirePermission, requireRole };
