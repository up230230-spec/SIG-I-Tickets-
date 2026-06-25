const express = require('express');
const router = express.Router();

/**
 * Agregador de rutas de la API. Se monta en /api desde server.js.
 */
router.use('/auth', require('./authRoutes'));
router.use('/tickets', require('./ticketRoutes'));
router.use('/areas', require('./areaRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/forum', require('./forumRoutes'));

// Healthcheck.
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'SIG-I API' }));

module.exports = router;
