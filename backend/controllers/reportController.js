/**
 * Módulo D (parcial) — Reportes exportables.
 *
 * STUB: delega la generación a services/reportService.js (PDF/CSV).
 */
const notImplemented = (name) => (req, res) =>
  res.status(501).json({ message: `TODO: implementar ${name}` });

// GET /api/reports/tickets.csv — exportar tickets a CSV.
exports.exportCsv = notImplemented('exportCsv');

// GET /api/reports/tickets.pdf — exportar reporte a PDF.
exports.exportPdf = notImplemented('exportPdf');
