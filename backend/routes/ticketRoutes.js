const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/roles');

// Todas las rutas de tickets requieren autenticación.
router.use(protect);

router.post('/', requirePermission(PERMISSIONS.TICKET_CREATE), ctrl.createTicket);
router.post('/emergency', requirePermission(PERMISSIONS.TICKET_CREATE), ctrl.createEmergency);
router.get('/', ctrl.listTickets); // El filtrado por rol se resuelve dentro del controller
router.get('/:id', ctrl.getTicket);
router.patch('/:id/status', requirePermission(PERMISSIONS.TICKET_UPDATE_STATUS), ctrl.updateStatus);
router.patch('/:id/reassign', requirePermission(PERMISSIONS.TICKET_REASSIGN), ctrl.reassignTicket);
router.post('/:id/comments', ctrl.addComment); // visibilidad validada en el controller
router.delete('/:id', requirePermission(PERMISSIONS.TICKET_DELETE), ctrl.deleteTicket);

module.exports = router;
