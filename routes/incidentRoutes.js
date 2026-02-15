const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');


router.post('/', incidentController.createIncident);

router.delete('/:id', incidentController.deleteIncident);
router.get('/', incidentController.getIncidents);

module.exports = router;