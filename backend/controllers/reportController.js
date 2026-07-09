/**
 * Módulo D (parcial) — Reportes exportables.
 *
 * Delega la generación a services/reportService.js (CSV / PDF) y envía el
 * archivo con las cabeceras de descarga adecuadas. Acepta filtros por
 * querystring: ?status=&area=&severity=&from=&to=
 */
const { generateCsv, generatePdf } = require('../services/reportService');
const { recordAudit } = require('../middleware/audit');

const stamp = () => new Date().toISOString().slice(0, 10);

// GET /api/dashboard/reports/tickets.csv — exportar tickets a CSV.
exports.exportCsv = async (req, res, next) => {
  try {
    const csv = await generateCsv(req.query);
    await recordAudit(req, 'report.export_csv', 'Ticket', null, { filters: req.query });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sigi-tickets-${stamp()}.csv"`
    );
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/reports/tickets.pdf — exportar reporte a PDF.
exports.exportPdf = async (req, res, next) => {
  try {
    const pdf = await generatePdf(req.query);
    await recordAudit(req, 'report.export_pdf', 'Ticket', null, { filters: req.query });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sigi-reporte-${stamp()}.pdf"`
    );
    return res.send(pdf);
  } catch (err) {
    next(err);
  }
};
