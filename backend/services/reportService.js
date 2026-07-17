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

// --- PDF (constructor con diseño de tabla) -------------------------------
//
// Motor de dibujo mínimo pero real (sin dependencias): soporta rectángulos
// rellenos, líneas y texto posicionado en coordenadas X fijas. Esto es lo que
// permite que las columnas queden ALINEADAS (el enfoque anterior rellenaba con
// espacios usando Helvetica, una fuente proporcional, y se veía desordenado).

// Escapa los caracteres especiales de una cadena literal PDF.
const pdfEscape = (s) => String(s).replace(/[\\()]/g, (c) => '\\' + c);

// Sustituye caracteres no Latin-1 (Helvetica base no soporta multibyte).
const toLatin1 = (s) => String(s).replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

// #rrggbb -> [r,g,b] normalizado 0..1 para los operadores de color del PDF.
const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ].map((n) => n.toFixed(3));
};

// Paleta del reporte (coherente con el tema de la app).
const C = {
  navy: rgb('#0a2540'), blue: rgb('#2563eb'), blue50: rgb('#eff6ff'),
  white: rgb('#ffffff'), text: rgb('#0f172a'), muted: rgb('#64748b'),
  border: rgb('#e2e8f0'), zebra: rgb('#f8fafc'),
  critica: rgb('#b91c1c'), alta: rgb('#c2410c'), media: rgb('#1e4f8a'),
};
const SEV_COLOR = { critica: C.critica, alta: C.alta, media: C.media };

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 36;

// Definición de columnas de la tabla: x (izquierda), ancho y máx. de caracteres.
const COLS = [
  { key: 'folio',    title: 'Folio',     x: 40,  w: 92,  max: 16 },
  { key: 'area',     title: 'Área',      x: 132, w: 78,  max: 13 },
  { key: 'severity', title: 'Sev.',      x: 210, w: 52,  max: 9 },
  { key: 'status',   title: 'Estado',    x: 262, w: 78,  max: 12 },
  { key: 'created',  title: 'Creado',    x: 340, w: 92,  max: 16 },
  { key: 'title',    title: 'Título',    x: 432, w: 144, max: 34 },
];

const truncate = (s, max) => {
  const v = toLatin1(s == null ? '' : String(s));
  return v.length > max ? v.slice(0, max - 2) + '..' : v;
};

// --- Operadores de dibujo → fragmento de content stream ---
const opRect = (x, y, w, h, color) => `${color.join(' ')} rg\n${x} ${y} ${w} ${h} re\nf`;
const opLine = (x1, y1, x2, y2, color, width = 0.5) =>
  `${color.join(' ')} RG\n${width} w\n${x1} ${y1} m ${x2} ${y2} l\nS`;
const opText = (x, y, text, size, color, bold = false) =>
  `BT\n/${bold ? 'F2' : 'F1'} ${size} Tf\n${color.join(' ')} rg\n1 0 0 1 ${x} ${y} Tm\n(${pdfEscape(toLatin1(text))}) Tj\nET`;

// Ensambla el documento PDF a partir de una lista de páginas (cada una es un
// arreglo de fragmentos de operadores).
const buildPdf = (pages) => {
  const contents = pages.map((ops) => ops.join('\n'));

  const objects = [];
  const pageObjIds = [];
  let nextId = 4; // 1 Catalog · 2 Pages · 3 Fonts-dict placeholders (3=F1,? )
  const contentRefs = [];
  contents.forEach((stream) => {
    const pageId = nextId++;
    const contentId = nextId++;
    pageObjIds.push(pageId);
    contentRefs.push({ pageId, contentId, stream });
  });
  const f1Id = nextId++; // Helvetica
  const f2Id = nextId++; // Helvetica-Bold

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`;
  objects[3] = '<< >>'; // reservado (sin uso) para conservar numeración estable

  contentRefs.forEach(({ pageId, contentId, stream }) => {
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] =
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  });
  objects[f1Id] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[f2Id] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  const totalObjs = nextId - 1;
  for (let i = 1; i <= totalObjs; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjs; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
};

// Dibuja la fila de encabezado de la tabla en la posición y; devuelve la y bajo ella.
const drawTableHeader = (ops, y) => {
  ops.push(opRect(MARGIN, y - 4, PAGE_W - 2 * MARGIN, 20, C.navy));
  COLS.forEach((c) => ops.push(opText(c.x, y + 2, c.title, 9, C.white, true)));
  return y - 6;
};

const generatePdf = async (filters = {}) => {
  const tickets = await queryTickets(filters);

  // Agregados para el resumen.
  const byStatus = { abierto: 0, en_proceso: 0, resuelto: 0, cerrado: 0 };
  const bySeverity = { critica: 0, alta: 0, media: 0 };
  tickets.forEach((t) => {
    if (byStatus[t.status] != null) byStatus[t.status] += 1;
    if (bySeverity[t.severity] != null) bySeverity[t.severity] += 1;
  });
  const kpis = [
    { label: 'Total', value: tickets.length },
    { label: 'Abiertos', value: byStatus.abierto + byStatus.en_proceso },
    { label: 'Resueltos', value: byStatus.resuelto + byStatus.cerrado },
    { label: 'Emergencias', value: tickets.filter((t) => t.isEmergency && t.status !== 'cerrado').length },
  ];

  const pages = [];
  let ops = [];
  const ROW_H = 18;
  const BOTTOM = 48;

  // --- Portada de la primera página ---
  // Banda de encabezado.
  ops.push(opRect(0, PAGE_H - 54, PAGE_W, 54, C.navy));
  ops.push(opText(MARGIN, PAGE_H - 30, 'SIG-I', 20, C.white, true));
  ops.push(opText(MARGIN + 66, PAGE_H - 30, 'Reporte de incidencias', 13, C.blue50));
  ops.push(opText(MARGIN, PAGE_H - 46, `Generado: ${fmtDate(new Date())}`, 9, C.blue50));

  // Filtros aplicados (si los hay).
  const applied = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('  ·  ');
  ops.push(opText(MARGIN, PAGE_H - 74, applied ? `Filtros — ${applied}` : 'Sin filtros (todos los tickets)', 9, C.muted));

  // Tarjetas KPI.
  const kpiY = PAGE_H - 138;
  const kpiW = (PAGE_W - 2 * MARGIN - 3 * 10) / 4;
  kpis.forEach((k, i) => {
    const x = MARGIN + i * (kpiW + 10);
    ops.push(opRect(x, kpiY, kpiW, 48, C.blue50));
    ops.push(opText(x + 10, kpiY + 26, String(k.value), 20, C.navy, true));
    ops.push(opText(x + 10, kpiY + 10, k.label, 9, C.muted));
  });

  // Chips de severidad.
  let cx = MARGIN;
  const chipY = kpiY - 26;
  ops.push(opText(MARGIN, chipY + 20, 'Por severidad:', 9, C.text, true));
  ['critica', 'alta', 'media'].forEach((s) => {
    const label = `${s}: ${bySeverity[s]}`;
    const w = 8 + label.length * 5.2;
    ops.push(opRect(cx + 82, chipY + 8, w, 15, SEV_COLOR[s]));
    ops.push(opText(cx + 87, chipY + 12, label, 9, C.white, true));
    cx += w + 8;
  });

  // --- Tabla ---
  let y = chipY - 16;
  y = drawTableHeader(ops, y);
  y -= ROW_H;

  let zebra = 0;
  tickets.forEach((t) => {
    // Salto de página: nueva página con el encabezado de tabla repetido.
    if (y < BOTTOM) {
      pages.push(ops);
      ops = [];
      y = drawTableHeader(ops, PAGE_H - 60);
      y -= ROW_H;
    }
    // Franja cebra.
    if (zebra % 2 === 1) ops.push(opRect(MARGIN, y - 4, PAGE_W - 2 * MARGIN, ROW_H, C.zebra));

    const cell = {
      folio: truncate(t.folio, COLS[0].max),
      area: truncate(t.area, COLS[1].max),
      severity: truncate(t.severity, COLS[2].max),
      status: truncate(t.status, COLS[3].max),
      created: truncate(fmtDate(t.createdAt), COLS[4].max),
      title: truncate((t.isEmergency ? '! ' : '') + (t.title || ''), COLS[5].max),
    };
    COLS.forEach((c) => {
      const color = c.key === 'severity' ? (SEV_COLOR[t.severity] || C.text) : C.text;
      ops.push(opText(c.x, y, cell[c.key], 9, color, c.key === 'severity'));
    });
    // Línea separadora inferior.
    ops.push(opLine(MARGIN, y - 5, PAGE_W - MARGIN, y - 5, C.border, 0.4));
    y -= ROW_H;
    zebra += 1;
  });

  if (!tickets.length) {
    ops.push(opText(MARGIN, y, 'No hay tickets para los filtros seleccionados.', 11, C.muted));
  }

  // Pie de página con numeración en todas las páginas.
  pages.push(ops);
  const total = pages.length;
  pages.forEach((pageOps, i) => {
    pageOps.push(opText(PAGE_W - MARGIN - 60, 30, `Página ${i + 1} de ${total}`, 8, C.muted));
    pageOps.push(opText(MARGIN, 30, 'SIG-I — Sistema Integral de Gestión de Incidencias', 8, C.muted));
  });

  return buildPdf(pages);
};

module.exports = { generateCsv, generatePdf };
