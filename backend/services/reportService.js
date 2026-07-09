/**
 * Generación de reportes exportables (Módulo D): CSV y PDF.
 *
 * Sin dependencias externas: el CSV se serializa a mano (con escapado RFC-4180)
 * y el PDF se construye como un documento PDF 1.4 mínimo pero válido
 * (fuente Helvetica, paginación automática). Suficiente para un listado y
 * resumen de tickets, evitando añadir librerías pesadas al proyecto.
 */
const Ticket = require('../models/Ticket');

// Traduce el querystring de filtros a un filtro de Mongoose.
const buildFilter = (filters = {}) => {
  const f = {};
  if (filters.status) f.status = filters.status;
  if (filters.area) f.area = filters.area;
  if (filters.severity) f.severity = filters.severity;
  if (filters.from || filters.to) {
    f.createdAt = {};
    if (filters.from) f.createdAt.$gte = new Date(filters.from);
    if (filters.to) f.createdAt.$lte = new Date(filters.to);
  }
  return f;
};

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '');

const queryTickets = (filters) =>
  Ticket.find(buildFilter(filters))
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

// --- CSV ------------------------------------------------------------------

// Escapa un campo según RFC-4180 (comillas dobles + duplicado interno).
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const COLUMNS = [
  ['Folio', (t) => t.folio],
  ['Codigo', (t) => t.incidentCode],
  ['Titulo', (t) => t.title],
  ['Area', (t) => t.area],
  ['Severidad', (t) => t.severity],
  ['Estado', (t) => t.status],
  ['Emergencia', (t) => (t.isEmergency ? 'si' : 'no')],
  ['Reportado por', (t) => t.reportedBy?.name || ''],
  ['Asignado a', (t) => t.assignedTo?.name || ''],
  ['Creado', (t) => fmtDate(t.createdAt)],
  ['Resuelto', (t) => fmtDate(t.resolvedAt)],
];

const generateCsv = async (filters = {}) => {
  const tickets = await queryTickets(filters);
  const header = COLUMNS.map((c) => c[0]).join(',');
  const rows = tickets.map((t) => COLUMNS.map((c) => csvCell(c[1](t))).join(','));
  // BOM para que Excel reconozca UTF-8.
  return '﻿' + [header, ...rows].join('\r\n') + '\r\n';
};

// --- PDF (constructor mínimo) --------------------------------------------

// Escapa los caracteres especiales de una cadena literal PDF.
const pdfEscape = (s) => String(s).replace(/[\\()]/g, (c) => '\\' + c);

// Sustituye caracteres no Latin-1 (Helvetica base no soporta multibyte).
const toLatin1 = (s) =>
  String(s)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
    .slice(0, 110); // recorta líneas muy largas

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 40;
const TOP_Y = 750;
const BOTTOM_Y = 50;
const LINE_H = 14;

// Construye un PDF de una sola columna de texto a partir de líneas {text, size}.
const buildPdf = (lines) => {
  // Paginación: agrupa líneas en páginas según el alto disponible.
  const pages = [];
  let current = [];
  let y = TOP_Y;
  for (const line of lines) {
    if (y < BOTTOM_Y) {
      pages.push(current);
      current = [];
      y = TOP_Y;
    }
    current.push({ ...line, y });
    y -= LINE_H;
  }
  if (current.length) pages.push(current);
  if (!pages.length) pages.push([]);

  // Cada página → un content stream.
  const contents = pages.map((pageLines) => {
    const ops = ['BT'];
    for (const l of pageLines) {
      ops.push(`/F1 ${l.size || 10} Tf`);
      ops.push(`1 0 0 1 ${MARGIN_X} ${l.y} Tm`);
      ops.push(`(${pdfEscape(toLatin1(l.text))}) Tj`);
    }
    ops.push('ET');
    return ops.join('\n');
  });

  // Numeración de objetos:
  // 1 Catalog · 2 Pages · 3 Font · luego por página: Page + Content.
  const objects = [];
  const pageObjIds = [];
  let nextId = 4;
  const contentRefs = [];
  contents.forEach((stream) => {
    const pageId = nextId++;
    const contentId = nextId++;
    pageObjIds.push(pageId);
    contentRefs.push({ pageId, contentId, stream });
  });

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pageObjIds.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  contentRefs.forEach(({ pageId, contentId, stream }) => {
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] =
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  });

  // Ensamblado con tabla xref.
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  const totalObjs = nextId - 1;
  for (let i = 1; i <= totalObjs; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${totalObjs + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= totalObjs; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
};

const generatePdf = async (filters = {}) => {
  const tickets = await queryTickets(filters);

  const now = fmtDate(new Date());
  const lines = [
    { text: 'SIG-I — Reporte de incidencias', size: 16 },
    { text: `Generado: ${now}    Total: ${tickets.length}`, size: 10 },
    { text: '', size: 10 },
  ];

  // Resumen por estado.
  const byStatus = {};
  tickets.forEach((t) => (byStatus[t.status] = (byStatus[t.status] || 0) + 1));
  lines.push({ text: 'Resumen por estado:', size: 12 });
  Object.entries(byStatus).forEach(([k, v]) =>
    lines.push({ text: `   ${k}: ${v}`, size: 10 })
  );
  lines.push({ text: '', size: 10 });

  // Listado.
  lines.push({ text: 'Folio        Area           Sev      Estado       Titulo', size: 12 });
  tickets.forEach((t) => {
    const row =
      `${(t.folio || '').padEnd(13)}` +
      `${(t.area || '').padEnd(15)}` +
      `${(t.severity || '').padEnd(9)}` +
      `${(t.status || '').padEnd(13)}` +
      `${t.title || ''}`;
    lines.push({ text: row, size: 9 });
  });

  return buildPdf(lines);
};

module.exports = { generateCsv, generatePdf };
