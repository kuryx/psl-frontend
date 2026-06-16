import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { combinarBalthazard } from "./calculoPCL";

// ─── Paleta de colores ────────────────────────────────────────────
const C = {
  primary:   [0, 70, 127],
  secondary: [41, 128, 185],
  success:   [39, 174, 96],
  white:     [255, 255, 255],
  dark:      [15, 20, 25],
  gray:      [90, 100, 110],
  header:    [236, 240, 244],
  lightBg:   [245, 248, 252],
};

const MARGIN_L = 14;
const MARGIN_R = 14;
const PW = 210;          // page width mm (A4)
const CW = PW - MARGIN_L - MARGIN_R; // content width
const HEADER_H = 28;     // alto del encabezado con logo

// ─── Fuente del PDF (leída de preferencias del usuario) ──────────
const getPdfFont = () => {
  try {
    const prefs = JSON.parse(localStorage.getItem("userPreferences") || "{}");
    return prefs.pdfFont || "times";
  } catch { return "times"; }
};

// ─── Utilidades ──────────────────────────────────────────────────
const stripHtml = (t) => {
  if (!t) return "";
  const d = new DOMParser().parseFromString(t, "text/html");
  return d.body.textContent || "";
};

const fmtFecha = (f) => {
  if (!f) return "N/A";
  return new Date(f).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });
};

const v = (x) => (x !== undefined && x !== null && x !== "") ? String(x) : "N/A";

// ─── Cargar logo (ratio fijo 1280×997 px) ────────────────────────
const LOGO_RATIO = 1280 / 997; // ancho / alto — dimensiones reales del archivo

const cargarLogo = async () => {
  try {
    const resp = await fetch("/logo-md.jpeg");
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ dataUrl: reader.result, ratio: LOGO_RATIO });
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// ─── Encabezado de página ─────────────────────────────────────────
const addHeader = (doc, logo, numeroDictamen) => {
  // Fondo suave
  doc.setFillColor(...C.lightBg);
  doc.rect(0, 0, PW, HEADER_H, "F");

  // Logo respetando proporciones (máx 20 mm de alto, 52 mm de ancho)
  if (logo) {
    const maxH = 20;
    const maxW = 52;
    let h = maxH;
    let w = h * logo.ratio;
    if (w > maxW) { w = maxW; h = w / logo.ratio; }
    const topOffset = 4 + (maxH - h) / 2;
    doc.addImage(logo.dataUrl, "JPEG", MARGIN_L, topOffset, w, h);
  }

  // Bloque de título (derecha)
  doc.setFontSize(9);
  doc.setFont(getPdfFont(), "bold");
  doc.setTextColor(...C.primary);
  doc.text("DICTAMEN DE CALIFICACIÓN DE", PW - MARGIN_R, 9, { align: "right" });
  doc.text("PÉRDIDA DE CAPACIDAD LABORAL", PW - MARGIN_R, 14, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont(getPdfFont(), "normal");
  doc.setTextColor(...C.gray);
  doc.text(`Decreto 1507 de 2014 — Manual Único`, PW - MARGIN_R, 19, { align: "right" });
  doc.text(`No. ${numeroDictamen}`, PW - MARGIN_R, 24, { align: "right" });

  // Línea separadora
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_L, HEADER_H, PW - MARGIN_R, HEADER_H);

  doc.setTextColor(...C.dark);
};

// ─── Pie de página (se aplica al final sobre todas las páginas) ───
const addFooters = (doc, numeroDictamen, nombreCalificado, nombreMedico) => {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.gray);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_L, 282, PW - MARGIN_R, 282);
    doc.setFontSize(7);
    doc.setFont(getPdfFont(), "normal");
    doc.setTextColor(...C.gray);
    doc.text(
      `Médico Calificador: ${nombreMedico || "N/A"}  |  No. ${numeroDictamen}`,
      MARGIN_L, 286
    );
    doc.text(`Pág. ${i} / ${total}`, PW - MARGIN_R, 286, { align: "right" });
    doc.text(`Calificado: ${nombreCalificado}`, MARGIN_L, 290);
  }
  doc.setTextColor(...C.dark);
};

// ─── Título de sección ────────────────────────────────────────────
const secTitle = (doc, texto, y) => {
  doc.setFillColor(...C.secondary);
  doc.rect(MARGIN_L, y, CW, 7, "F");
  doc.setFontSize(9.5);
  doc.setFont(getPdfFont(), "bold");
  doc.setTextColor(...C.white);
  doc.text(texto, MARGIN_L + 3, y + 5.2);
  doc.setTextColor(...C.dark);
  return y + 10;
};

// ─── Nueva página ─────────────────────────────────────────────────
const nuevaPag = (doc, logo, numeroDictamen) => {
  doc.addPage();
  addHeader(doc, logo, numeroDictamen);
  return HEADER_H + 4;
};

// ─── Estilos comunes de tabla ─────────────────────────────────────
const tblOpts = ({ theme = "grid", cellPadding = 2.4 } = {}) => ({
  theme,
  styles: { font: getPdfFont(), fontSize: 8.5, cellPadding, lineWidth: 0.3, lineColor: [100, 110, 120], textColor: [15, 20, 25] },
  margin: { left: MARGIN_L, right: MARGIN_R },
});

// ─── Cabecera de 4 columnas (etiqueta-valor) ──────────────────────
const colStyle4 = {
  0: { cellWidth: 43, fillColor: C.header, fontStyle: "bold" },
  1: { cellWidth: 49 },
  2: { cellWidth: 43, fillColor: C.header, fontStyle: "bold" },
  3: { cellWidth: 47 },
};

// ─── Nombres completos de capítulos — Decreto 1507/2014 ──────────
const CAPITULO_NOMBRE = {
  "1":  "Capítulo 1. Deficiencias del sistema músculo-esquelético.",
  "2":  "Capítulo 2. Deficiencias del sistema cardiovascular.",
  "3":  "Capítulo 3. Deficiencias del sistema respiratorio.",
  "4":  "Capítulo 4. Deficiencias del sistema digestivo.",
  "5":  "Capítulo 5. Deficiencias del sistema urinario y renal.",
  "6":  "Capítulo 6. Deficiencias del sistema nervioso — lesiones estructurales.",
  "7":  "Capítulo 7. Deficiencias por VIH / SIDA e inmunodeficiencias.",
  "8":  "Capítulo 8. Deficiencias del sistema endocrino y metabólico.",
  "9":  "Capítulo 9. Deficiencias del sistema hematológico.",
  "10": "Capítulo 10. Deficiencias del sistema dermatológico.",
  "11": "Capítulo 11. Deficiencias del sistema oftalmológico.",
  "12": "Capítulo 12. Deficiencias del sistema nervioso central y periférico.",
  "13": "Capítulo 13. Deficiencias del sistema auditivo.",
  "14": "Capítulo 14. Deficiencias de salud mental y del comportamiento.",
};

// ─── Motor de consistencia Título I → AVD ────────────────────────
const _CONSIST_MAP = {
  1:  { d4: 1, d5: 1, d6: 2 },
  2:  { d4: 1, d5: 3, d6: 3 },
  3:  { d4: 1, d5: 2, d6: 2 },
  4:  { d5: 2 },
  5:  { d5: 2 },
  6:  { d1: 0, d3: 1, d4: 1, d5: 2, d6: 3 },
  7:  { d4: 2, d5: 2 },
  8:  { d4: 2, d5: 2 },
  9:  { d4: 2 },
  10: { d5: 1 },
  11: { d1: 0, d3: 1, d4: 1, d5: 3, d6: 3 },
  12: { d1: 1, d3: 2, d4: 1, d5: 2, d6: 3 },
  13: { d3: 2 },
  14: { d1: 1, d3: 1, d5: 2, d6: 3 },
};
const _CLASE_A_NIVEL = {
  '0': -1, 'I': 0, '1': 0, 'II': 1, '2': 1, 'III': 2, '3': 2,
  'IV': 3, '4': 3, 'V': 3, '5': 3,
};
const _AVD_NOMBRES = {
  d1: 'Aprendizaje y aplicación del conocimiento',
  d3: 'Comunicación',
  d4: 'Movilidad',
  d5: 'Autocuidado personal',
  d6: 'Vida doméstica',
};

const _calcularSugerenciasConsistencia = (detalleDeficiencias, avds) => {
  const pending = {};
  for (const def of (detalleDeficiencias || [])) {
    const cap = parseInt((def.capitulo || '').replace('Cap. ', ''));
    const nivel = _CLASE_A_NIVEL[def.clase] ?? -1;
    if (nivel < 0 || isNaN(cap)) continue;
    const mapping = _CONSIST_MAP[cap];
    if (!mapping) continue;
    for (const [domId, minNivel] of Object.entries(mapping)) {
      if (nivel < minNivel) continue;
      const domObj = AVD_DOMS.find(d => d.id === domId);
      const totalDom = domObj
        ? domObj.items.reduce((s, it) => s + (parseFloat((avds[domId] || {})[it.id]) || 0), 0)
        : 0;
      if (totalDom > 0) continue;
      if (!pending[domId]) pending[domId] = { causas: [], urgencia: 'media' };
      const label = def.descripcion || def.claseDescripcion || '';
      if (label && !pending[domId].causas.includes(label)) pending[domId].causas.push(label);
      if (nivel >= 2) pending[domId].urgencia = 'alta';
    }
  }
  return Object.entries(pending).map(([domId, info]) => ({
    domId, nombre: _AVD_NOMBRES[domId] || domId, ...info,
  })).sort((a, b) => (b.urgencia === 'alta' ? 1 : 0) - (a.urgencia === 'alta' ? 1 : 0));
};
const capNombre = (cap) => {
  const num = (cap || "").replace(/\D/g, "");
  return CAPITULO_NOMBRE[num] || cap;
};

// ─── Sub-cabecera estilo caja (como en PDF guía JNCI) ─────────────
const subHeader = (doc, texto, y, opts = {}) => {
  const { fillColor = C.header, textColor = C.dark, centered = false, fontSize = 8.5 } = opts;
  doc.setFillColor(...fillColor);
  doc.rect(MARGIN_L, y, CW, 6.5, "F");
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_L, y, CW, 6.5, "S");
  doc.setFontSize(fontSize);
  doc.setFont(getPdfFont(), "bold");
  doc.setTextColor(...textColor);
  const xText = centered ? MARGIN_L + CW / 2 : MARGIN_L + 3;
  doc.text(texto, xText, y + 4.7, centered ? { align: "center" } : {});
  doc.setTextColor(...C.dark);
  doc.setFont(getPdfFont(), "normal");
  return y + 9;
};


// ================================================================
// DOMINIOS AVD (se usa tanto para pre-calcular el resumen como para renderizar la tabla)
// ================================================================
const AVD_DOMS = [
  { id: 'd1', label: 'd1', nombre: '1. Aprendizaje y aplicación del conocimiento', items: [
    { num: '1.1', id: 'd110' }, { num: '1.2', id: 'd115' }, { num: '1.3', id: 'd140' },
    { num: '1.4', id: 'd150' }, { num: '1.5', id: 'd163' }, { num: '1.6', id: 'd166' },
    { num: '1.7', id: 'd170' }, { num: '1.8', id: 'd172' }, { num: '1.9', id: 'd175' },
    { num: '1.10', id: 'd1751' },
  ]},
  { id: 'd3', label: 'd3', nombre: '2. Comunicación', items: [
    { num: '2.1', id: 'd310' }, { num: '2.2', id: 'd315' }, { num: '2.3', id: 'd320' },
    { num: '2.4', id: 'd325' }, { num: '2.5', id: 'd330' }, { num: '2.6', id: 'd335' },
    { num: '2.7', id: 'd345' }, { num: '2.8', id: 'd350' }, { num: '2.9', id: 'd355' },
    { num: '2.10', id: 'd360' },
  ]},
  { id: 'd4', label: 'd4', nombre: '3. Movilidad', items: [
    { num: '3.1', id: 'd410' }, { num: '3.2', id: 'd415' }, { num: '3.3', id: 'd430' },
    { num: '3.4', id: 'd440' }, { num: '3.5', id: 'd445' }, { num: '3.6', id: 'd455' },
    { num: '3.7', id: 'd460' }, { num: '3.8', id: 'd465' }, { num: '3.9', id: 'd470' },
    { num: '3.10', id: 'd475' },
  ]},
  { id: 'd5', label: 'd5', nombre: '4. Autocuidado personal', items: [
    { num: '4.1', id: 'd510' }, { num: '4.2', id: 'd520' }, { num: '4.3', id: 'd530' },
    { num: '4.4', id: 'd540' }, { num: '4.5', id: 'd5401' }, { num: '4.6', id: 'd5402' },
    { num: '4.7', id: 'd550' }, { num: '4.8', id: 'd560' }, { num: '4.9', id: 'd570' },
    { num: '4.10', id: 'd5701' },
  ]},
  { id: 'd6', label: 'd6', nombre: '5. Vida doméstica', items: [
    { num: '5.1', id: 'd610' }, { num: '5.2', id: 'd620' }, { num: '5.3', id: 'd6200' },
    { num: '5.4', id: 'd630' }, { num: '5.5', id: 'd640' }, { num: '5.6', id: 'd6402' },
    { num: '5.7', id: 'd650' }, { num: '5.8', id: 'd660' }, { num: '5.9', id: 'd6504' },
    { num: '5.10', id: 'd6506' },
  ]},
];

// ================================================================
// FUNCIÓN PRINCIPAL
// ================================================================
export const generarPDFDictamen = async (evaluacion) => {
  const logo = await cargarLogo();
  const doc  = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont(getPdfFont(), "normal");

  const numDict = evaluacion.informacionDictamen?.numeroDictamen || "Sin número";
  const p  = evaluacion.paciente || {};
  const al = evaluacion.antecedentesLaborales || {};
  const rl = evaluacion.valoracionRolLaboral   || {};
  const avds = evaluacion.avdsDetalle          || {};

  // Pre-calcular Título II para usarlo en el resumen antes de renderizar su sección
  const _totalRL = (rl.totalRolLaboral !== undefined)
    ? rl.totalRolLaboral
    : (rl.restriccionesRolLaboral ?? 0) + (rl.restriccionesAutosuficiencia ?? 0) + (rl.restriccionesEdad ?? 0);
  const _sumaAVDs = AVD_DOMS.reduce((total, dom) => {
    const domData = avds[dom.id] || {};
    return total + dom.items.reduce((s, it) => s + (parseFloat(domData[it.id]) || 0), 0);
  }, 0);
  const _totalAVD = Math.min(Math.round(_sumaAVDs * 100) / 100, 20);
  const _totalTII = Math.round((_totalRL + _totalAVD) * 100) / 100;

  let y = 0;

  // ────────────────────────────────────────────────────────────────
  // PÁG 1 — PORTADA + INFO DICTAMEN + ENTIDAD CALIFICADORA
  // ────────────────────────────────────────────────────────────────
  addHeader(doc, logo, numDict);
  y = HEADER_H + 6;

  // Bloque portada
  doc.setFillColor(...C.lightBg);
  doc.roundedRect(MARGIN_L, y, CW, 22, 2, 2, "F");
  doc.setFontSize(15);
  doc.setFont(getPdfFont(), "bold");
  doc.setTextColor(...C.primary);
  doc.text("DICTAMEN DE CALIFICACIÓN", PW / 2, y + 8, { align: "center" });
  doc.text("DE PÉRDIDA DE CAPACIDAD LABORAL", PW / 2, y + 15, { align: "center" });
  doc.setFontSize(8);
  doc.setFont(getPdfFont(), "normal");
  doc.setTextColor(...C.gray);
  doc.text("Decreto 1507 de 2014 — Manual Único para la Calificación de la PCL", PW / 2, y + 20.5, { align: "center" });
  doc.setTextColor(...C.dark);
  y += 26;

  // Info rápida
  autoTable(doc, {
    ...tblOpts({ cellPadding: 1.5 }),
    startY: y,
    body: [
      [
        { content: "N.° Dictamen",            styles: { fontStyle: "bold", fillColor: C.header } }, numDict,
        { content: "Fecha del Dictamen",      styles: { fontStyle: "bold", fillColor: C.header } }, fmtFecha(evaluacion.informacionDictamen?.fechaDictamen),
      ],
      [
        { content: "Motivo de Calificación",  styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.motivoCalificacion),
        { content: "Tipo Calificación",       styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.tipoCalificacion),
      ],
      [
        { content: "Instancia Actual",        styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.instanciaActual),
        { content: "Primera Oportunidad",     styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.primeraOportunidad),
      ],
      [
        { content: "Primera Instancia",       styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.primeraInstancia),
        { content: "Nombre Solicitante",      styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.nombreSolicitante),
      ],
      [
        { content: "Tipo Solicitante",        styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.tipoSolicitante),
        { content: "Identificación",          styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.identificacionSolicitante),
      ],
      [
        { content: "Teléfono",               styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.telefonoSolicitante),
        { content: "Ciudad",                 styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.ciudadSolicitante),
      ],
      [
        { content: "Dirección",              styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.direccionSolicitante),
        { content: "Correo Electrónico",     styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.informacionDictamen?.correoElectronicoSolicitante),
      ],
    ],
    columnStyles: colStyle4,
  });
  y = doc.lastAutoTable.finalY + 7;

  // 1. Entidad Calificadora
  y = secTitle(doc, "2. ENTIDAD CALIFICADORA", y);
  const ec = evaluacion.entidadCalificadora || {};
  autoTable(doc, {
    ...tblOpts({ cellPadding: 1.5 }),
    startY: y,
    body: [
      [{ content: "Nombre / Razón Social", styles: { fontStyle: "bold", fillColor: C.header } }, v(ec.nombre),
       { content: "Identificación",        styles: { fontStyle: "bold", fillColor: C.header } }, v(ec.identificacion)],
      [{ content: "Dirección",             styles: { fontStyle: "bold", fillColor: C.header } }, v(ec.direccion),
       { content: "Ciudad",               styles: { fontStyle: "bold", fillColor: C.header } }, v(ec.ciudad)],
      [{ content: "Teléfono",             styles: { fontStyle: "bold", fillColor: C.header } }, v(ec.telefono),
       { content: "Correo Electrónico",   styles: { fontStyle: "bold", fillColor: C.header } }, v(ec.correoElectronico)],
    ],
    columnStyles: colStyle4,
  });
  y = doc.lastAutoTable.finalY + 7;

  // ────────────────────────────────────────────────────────────────
  // DATOS DEL TRABAJADOR + ANTECEDENTES LABORALES
  // (Nueva página solo si no hay espacio suficiente)
  // ────────────────────────────────────────────────────────────────
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "3. DATOS GENERALES DE LA PERSONA CALIFICADA", y);

  autoTable(doc, {
    ...tblOpts({ cellPadding: 1.5 }),
    startY: y,
    body: [
      [{ content: "Nombre Completo",      styles: { fontStyle: "bold", fillColor: C.header } },
       { content: v(p.nombreCompleto),    colSpan: 3, styles: { fontStyle: "bold", fontSize: 10 } }],
      [{ content: "Tipo Identificación",  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.tipoIdentificacion),
       { content: "N.° Identificación",   styles: { fontStyle: "bold", fillColor: C.header } }, v(p.cedula)],
      [{ content: "Lugar de Expedición",  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.lugarExpedicion),
       { content: "Fecha de Nacimiento",  styles: { fontStyle: "bold", fillColor: C.header } }, fmtFecha(p.fechaNacimiento)],
      [{ content: "Lugar de Nacimiento",  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.lugarNacimiento),
       { content: "Edad",                 styles: { fontStyle: "bold", fillColor: C.header } }, `${v(p.edad)} años`],
      [{ content: "Género",               styles: { fontStyle: "bold", fillColor: C.header } }, v(p.genero),
       { content: "Estado Civil",         styles: { fontStyle: "bold", fillColor: C.header } }, v(p.estadoCivil)],
      [{ content: "Escolaridad",          styles: { fontStyle: "bold", fillColor: C.header } }, v(p.escolaridad),
       { content: "Ciclo Vital",          styles: { fontStyle: "bold", fillColor: C.header } }, v(p.etapasCicloVital)],
      [{ content: "Ocupación",            styles: { fontStyle: "bold", fillColor: C.header } }, v(p.ocupacion),
       { content: "Tipo Usuario SGSS",    styles: { fontStyle: "bold", fillColor: C.header } }, v(p.tipoUsuarioSGSS)],
      [{ content: "Dirección",            styles: { fontStyle: "bold", fillColor: C.header } }, v(p.direccion),
       { content: "Ciudad",               styles: { fontStyle: "bold", fillColor: C.header } }, v(p.ciudad)],
      [{ content: "Teléfonos",            styles: { fontStyle: "bold", fillColor: C.header } }, (p.telefonos || []).join(", ") || "N/A",
       { content: "Correo Electrónico",   styles: { fontStyle: "bold", fillColor: C.header } }, v(p.correoElectronico)],
      [{ content: "EPS",                  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.eps),
       { content: "AFP",                  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.afp)],
      [{ content: "ARL",                  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.arl),
       { content: "Compañía de Seguros",  styles: { fontStyle: "bold", fillColor: C.header } }, v(p.companiaSeguro)],
    ],
    columnStyles: colStyle4,
  });
  y = doc.lastAutoTable.finalY + 7;

  // 4. Antecedentes Laborales
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "4. ANTECEDENTES LABORALES", y);

  autoTable(doc, {
    ...tblOpts({ cellPadding: 1.5 }),
    startY: y,
    body: [
      [{ content: "Tipo de Vinculación",  styles: { fontStyle: "bold", fillColor: C.header } }, v(al.tipoVinculacion),
       { content: "Trabajo / Empleo",     styles: { fontStyle: "bold", fillColor: C.header } }, v(al.trabajoEmpleo)],
      [{ content: "Cargo / Ocupación",    styles: { fontStyle: "bold", fillColor: C.header } }, v(al.ocupacion),
       { content: "Código CIUO",          styles: { fontStyle: "bold", fillColor: C.header } }, v(al.codigoCIUO)],
      [{ content: "Actividad Económica",  styles: { fontStyle: "bold", fillColor: C.header } }, v(al.actividadEconomica),
       { content: "Empresa",              styles: { fontStyle: "bold", fillColor: C.header } }, v(al.empresa)],
      [{ content: "Identificación Emp.",  styles: { fontStyle: "bold", fillColor: C.header } }, v(al.identificacionEmpresa),
       { content: "Dirección Empresa",    styles: { fontStyle: "bold", fillColor: C.header } }, v(al.direccionEmpresa)],
      [{ content: "Ciudad Empresa",       styles: { fontStyle: "bold", fillColor: C.header } }, v(al.ciudadEmpresa),
       { content: "Teléfono Empresa",     styles: { fontStyle: "bold", fillColor: C.header } }, v(al.telefonoEmpresa)],
      [{ content: "Fecha de Ingreso",     styles: { fontStyle: "bold", fillColor: C.header } }, fmtFecha(al.fechaIngreso),
       { content: "Antigüedad",           styles: { fontStyle: "bold", fillColor: C.header } }, v(al.antiguedad)],
    ],
    columnStyles: colStyle4,
  });
  y = doc.lastAutoTable.finalY + 4;

  if (al.descripcionCargos) {
    if (y > 255) y = nuevaPag(doc, logo, numDict);
    doc.setFontSize(8.5);
    doc.setFont(getPdfFont(), "bold");
    doc.text("Descripción de los cargos desempeñados y duración:", MARGIN_L, y + 5);
    y += 8;
    doc.setFont(getPdfFont(), "normal");
    const lines = doc.splitTextToSize(al.descripcionCargos, CW);
    for (const linea of lines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(linea, MARGIN_L, y);
      y += 4.5;
    }
    y += 3;
  }

  // ────────────────────────────────────────────────────────────────
  // SECCIÓN 5 — INFORMACIÓN CLÍNICA Y CONCEPTOS
  // ────────────────────────────────────────────────────────────────
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "5. INFORMACIÓN CLÍNICA Y CONCEPTOS", y);

  // 5.1 Resumen del caso
  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bold");
  doc.text("Resumen del Caso:", MARGIN_L, y);
  y += 5;
  doc.setFont(getPdfFont(), "normal");
  if (evaluacion.resumenCaso) {
    const rcLines = doc.splitTextToSize(stripHtml(evaluacion.resumenCaso), CW);
    for (const ln of rcLines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(ln, MARGIN_L, y); y += 4.5;
    }
  } else {
    doc.setFont(getPdfFont(), "italic");
    doc.text("No registrado.", MARGIN_L, y);
    doc.setFont(getPdfFont(), "normal");
    y += 4.5;
  }
  y += 5;

  // 5.2 Calificación primera oportunidad
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bold");
  doc.text("Calificación en Primera Oportunidad:", MARGIN_L, y);
  y += 5;
  doc.setFont(getPdfFont(), "normal");
  if (evaluacion.calificacionPrimeraOportunidad) {
    const cpLines = doc.splitTextToSize(stripHtml(evaluacion.calificacionPrimeraOportunidad), CW);
    for (const ln of cpLines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(ln, MARGIN_L, y); y += 4.5;
    }
  } else {
    doc.setFont(getPdfFont(), "italic");
    doc.text("No registrado.", MARGIN_L, y);
    doc.setFont(getPdfFont(), "normal");
    y += 4.5;
  }
  y += 5;

  // 5.3 Historial clínico
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bold");
  doc.text("Resumen de Información Clínica:", MARGIN_L, y);
  y += 5;
  doc.setFont(getPdfFont(), "normal");
  const hcLines = doc.splitTextToSize(stripHtml(evaluacion.historialClinico || "No registrado."), CW);
  for (const ln of hcLines) {
    if (y > 271) y = nuevaPag(doc, logo, numDict);
    doc.text(ln, MARGIN_L, y); y += 4.5;
  }
  y += 5;

  // 5.4 Conceptos médicos — bloques individuales
  if (evaluacion.conceptosMedicos?.length > 0) {
    if (y > 252) y = nuevaPag(doc, logo, numDict);
    doc.setFontSize(9);
    doc.setFont(getPdfFont(), "bold");
    doc.setTextColor(...C.primary);
    doc.text("Conceptos Médicos:", MARGIN_L, y);
    doc.setTextColor(...C.dark);
    y += 6;

    for (const con of evaluacion.conceptosMedicos) {
      if (y > 258) y = nuevaPag(doc, logo, numDict);
      // Línea separadora
      doc.setDrawColor(...C.secondary);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_L, y, PW - MARGIN_R, y);
      y += 4;
      // Encabezado del concepto
      doc.setFontSize(8);
      doc.setFont(getPdfFont(), "bold");
      doc.text(`Fecha: ${con.fecha ? fmtFecha(con.fecha) : "N/A"}     Especialidad: ${con.especialidad || "N/A"}`, MARGIN_L, y);
      y += 5;
      // Label "Resumen:"
      doc.text("Resumen:", MARGIN_L, y);
      y += 4.5;
      doc.setFont(getPdfFont(), "normal");
      if (con.resumen) {
        const cLines = doc.splitTextToSize(stripHtml(con.resumen), CW);
        for (const ln of cLines) {
          if (y > 271) y = nuevaPag(doc, logo, numDict);
          doc.text(ln, MARGIN_L, y);
          y += 4.5;
        }
      }
      y += 4;
    }
    // Línea de cierre
    doc.setDrawColor(...C.secondary);
    doc.line(MARGIN_L, y, PW - MARGIN_R, y);
    y += 7;
  }

  // 5.5 Concepto de rehabilitación
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bold");
  doc.text("Concepto de Rehabilitación:", MARGIN_L, y);
  y += 5;
  doc.setFont(getPdfFont(), "normal");
  doc.text(`Proceso de rehabilitación: ${v(evaluacion.procesoRehabilitacion)}`, MARGIN_L, y);
  y += 5;
  if (evaluacion.descripcionRehabilitacion) {
    const drLines = doc.splitTextToSize(evaluacion.descripcionRehabilitacion, CW);
    doc.text(drLines, MARGIN_L, y);
    y += drLines.length * 4.5;
  }
  y += 5;

  // 5.6 Valoraciones del calificador / equipo interdisciplinario
  if (evaluacion.valoracionesCalificador?.length > 0) {
    if (y > 252) y = nuevaPag(doc, logo, numDict);
    doc.setFontSize(8.5);
    doc.setFont(getPdfFont(), "bold");
    doc.text("Valoraciones del Calificador o Equipo Interdisciplinario:", MARGIN_L, y);
    y += 6;

    for (const val of evaluacion.valoracionesCalificador) {
      if (y > 258) y = nuevaPag(doc, logo, numDict);
      doc.setDrawColor(...C.secondary);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_L, y, PW - MARGIN_R, y);
      y += 4;
      doc.setFont(getPdfFont(), "bold");
      doc.setFontSize(8);
      doc.text(`Fecha: ${val.fecha ? fmtFecha(val.fecha) : "N/A"}     Especialidad: ${val.especialidad || "N/A"}`, MARGIN_L, y);
      y += 5;
      doc.text("Resumen:", MARGIN_L, y);
      y += 4.5;
      doc.setFont(getPdfFont(), "normal");
      if (val.valoracion) {
        const vLines = doc.splitTextToSize(stripHtml(val.valoracion), CW);
        for (const ln of vLines) {
          if (y > 271) y = nuevaPag(doc, logo, numDict);
          doc.text(ln, MARGIN_L, y);
          y += 4.5;
        }
      }
      y += 4;
    }
    doc.setDrawColor(...C.secondary);
    doc.line(MARGIN_L, y, PW - MARGIN_R, y);
    y += 4;
  }

  // ────────────────────────────────────────────────────────────────
  // 5.7 FUNDAMENTOS DE DERECHO — sub-sección dentro de la sección 5
  // ────────────────────────────────────────────────────────────────
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(9);
  doc.setFont(getPdfFont(), "bold");
  doc.setTextColor(...C.secondary);
  doc.text("Fundamentos de Derecho:", MARGIN_L, y);
  doc.setTextColor(...C.dark);
  y += 6;

  const FUND_BLOQUES = [
    { style: "normal", text: "Para comprender el sistema de calificación de la pérdida de capacidad laboral en Colombia, es fundamental entender su estructura normativa. Esta se organiza en una Jerarquía Piramidal compuesta de tres niveles: Leyes (reglas principales), Decretos (desarrollo detallado) y Jurisprudencia (interpretación y unificación)." },
    { style: "spacer" },
    { style: "heading", text: "1. El Fundamento Legal: Leyes que Crean el Sistema." },
    { style: "normal", text: "El sistema de seguridad social en Colombia tiene su base legal en la Ley 100 de 1993, norma que creó el Sistema de Seguridad Social Integral y definió las reglas generales del sistema pensional. Define legalmente el estado de Invalidez como la pérdida de capacidad laboral igual o superior al 50%. Esta ley ha sido actualizada e interpretada en numerosas ocasiones por la Corte Constitucional, por lo que a la hora de analizar un caso concreto es necesario consultarla junto con la jurisprudencia vigente para entender su aplicación actual." },
    { style: "spacer" },
    { style: "heading", text: "2. La Reglamentación Específica: Decretos Clave para la Calificación." },
    { style: "subheading", text: "2.1. El Manual Único de Calificación (Decreto 1507 de 2014)." },
    { style: "normal", text: "El Decreto 1507 de 2014 es la norma técnica por excelencia. Expide el Manual Único para la Calificación de la Pérdida de Capacidad Laboral y Ocupacional, con las tablas, criterios y pasos obligatorios para calcular el porcentaje de PCL. Es el instrumento técnico y jurídico que deben aplicar las EPS, AFP, ARL y Juntas de Calificación. Desde 2024, el Ministerio del Trabajo ha anunciado su actualización, encargando estudios a la Universidad de Antioquia para tal fin." },
    { style: "subheading", text: "2.2. La Organización de las Juntas de Calificación (Decreto 1352 de 2013)." },
    { style: "normal", text: "El Decreto 1352 de 2013 reglamenta la organización y el funcionamiento de las Juntas de Calificación de Invalidez, organismos autónomos con personería jurídica propia que dirimen controversias sobre la calificación de la pérdida de capacidad laboral cuando no se está de acuerdo con una calificación inicial." },
    { style: "subheading", text: "2.3. La Norma Marco del Sector Trabajo (Decreto 1072 de 2015)." },
    { style: "normal", text: "El Decreto 1072 de 2015 es el Decreto Único Reglamentario del Sector Trabajo. Compila y unifica las normas reglamentarias del sector, incluyendo aspectos de las Juntas de Calificación de Invalidez. Su consulta es indispensable para tener el panorama normativo completo y actualizado." },
    { style: "spacer" },
    { style: "heading", text: "3. La Guía para la Acción: Circulares y Otros Documentos." },
    { style: "bullet", text: "• Circulares de la Junta Nacional de Calificación de Invalidez: contienen lineamientos específicos sobre procedimientos, interpretación de dudas recurrentes y lineamientos administrativos para el funcionamiento de las juntas." },
    { style: "bullet", text: "• Circulares y Resoluciones de la UGPP: la Unidad de Gestión Pensional y Parafiscales emite documentos que afectan la gestión pensional, incluyendo aspectos de la Calificación de PCL, especialmente en lo concerniente a la Revisión Trienal de la Invalidez." },
    { style: "spacer" },
    { style: "heading", text: "4. El Rol del Juez Constitucional: La Jurisprudencia como Fuente de Derecho." },
    { style: "bullet", text: "• Precisión de conceptos: La Corte Constitucional ha definido que la PCL se acredita con la calificación emitida por las entidades competentes y que el Dictamen de una Junta de Calificación de Invalidez no es la única prueba para acreditarla." },
    { style: "bullet", text: "• Protección de derechos: La Jurisprudencia protege el Debido Proceso en los trámites de calificación, pronunciándose en sentencias como la T-147 de 2025 y la T-061 de 2026, asegurando que los procedimientos se adelanten con respeto a las garantías fundamentales." },
    { style: "bullet", text: "• Actualización de requisitos: La Corte ha revisado y, en ocasiones, modificado la interpretación de los requisitos legales para acceder a la Pensión de Invalidez." },
    { style: "spacer" },
    { style: "normal", text: "En resumen, el Fundamento del Derecho para la Calificación de la Pérdida de Capacidad Laboral en Colombia es un Sistema Dinámico que se nutre de las leyes (Ley 100 de 1993), su desarrollo reglamentario (Decretos 1507/2014, 1352/2013 y 1072/2015), las Circulares y Resoluciones de las entidades administrativas, y principalmente de la interpretación actualizada de la Corte Constitucional." },
  ];

  for (const bloque of FUND_BLOQUES) {
    if (bloque.style === "spacer") { y += 3; continue; }
    if (y > 255) y = nuevaPag(doc, logo, numDict);
    doc.setFontSize(8.5);
    if (bloque.style === "heading") {
      doc.setFont(getPdfFont(), "bold");
    } else if (bloque.style === "subheading") {
      doc.setFont(getPdfFont(), "bolditalic");
    } else {
      doc.setFont(getPdfFont(), "normal");
    }
    const indent = bloque.style === "bullet" ? MARGIN_L + 3 : MARGIN_L;
    const ancho  = bloque.style === "bullet" ? CW - 3 : CW;
    const fLines = doc.splitTextToSize(bloque.text, ancho);
    for (const fln of fLines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(fln, indent, y); y += 4.5;
    }
    y += (bloque.style === "heading" ? 2 : 1);
  }
  y += 5;

  // ── Principios de ponderación + Tabla 1 + Fórmula niños ─────────
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bolditalic");
  doc.text("Principios de Ponderación — Decreto 1507 de 2014, Anexo Técnico.", MARGIN_L, y); y += 5;
  doc.setFont(getPdfFont(), "normal");
  const ppText = "Para efectos de calificación, el Manual Único para la Calificación de la Pérdida de Capacidad Laboral y Ocupacional, se distribuye porcentualmente de la siguiente manera: El rango de calificación oscila entre un mínimo de cero por ciento (0%) y un máximo de cien por ciento (100%), correspondiendo, cincuenta por ciento (50%) al Título Primero (Valoración de las deficiencias) y cincuenta por ciento (50%) al Título Segundo (Valoración del rol laboral, rol ocupacional y otras áreas ocupacionales) del Anexo Técnico.";
  const ppLines = doc.splitTextToSize(ppText, CW);
  for (const ln of ppLines) { if (y > 271) y = nuevaPag(doc, logo, numDict); doc.text(ln, MARGIN_L, y); y += 4.5; }
  y += 3;

  doc.setFont(getPdfFont(), "italic");
  doc.text("Tabla 1. Ponderación usada en el Anexo Técnico del Manual", MARGIN_L, y); y += 4;
  doc.setFont(getPdfFont(), "normal");

  if (y > 255) y = nuevaPag(doc, logo, numDict);
  autoTable(doc, {
    ...tblOpts({ theme: "grid" }),
    startY: y,
    head: [["", "Ponderación"]],
    body: [
      ["Título Primero. Valoración de las deficiencias", "50%"],
      ["Título Segundo. Valoración del rol laboral, rol ocupacional y otras áreas ocupacionales.", "50%"],
    ],
    headStyles: { fillColor: C.header, textColor: C.dark, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 148 }, 1: { cellWidth: 34, halign: "center" } },
  });
  y = doc.lastAutoTable.finalY + 5;

  // Fórmula para niños/adolescentes
  if (y > 258) y = nuevaPag(doc, logo, numDict);
  const ninosText = "El valor de la pérdida de capacidad ocupacional para niños, niñas (mayores de 3 años) y adolescentes será: valor final de la deficiencia + valor final del Título Segundo.";
  const ninosLines = doc.splitTextToSize(ninosText, CW);
  for (const ln of ninosLines) { if (y > 271) y = nuevaPag(doc, logo, numDict); doc.text(ln, MARGIN_L, y); y += 4.5; }
  y += 3;

  if (y > 255) y = nuevaPag(doc, logo, numDict);
  autoTable(doc, {
    ...tblOpts({ theme: "grid" }),
    startY: y,
    body: [[
      { content: "Pérdida de Capacidad Ocupacional\n= (mayores de 3 años.)", styles: { halign: "center", fontStyle: "bold", fillColor: C.lightBg, valign: "middle" } },
      { content: "+", styles: { halign: "center", fontStyle: "bold", fontSize: 13, valign: "middle" } },
      { content: "Valor Final del Título Primero\n(ponderado al 50%)", styles: { halign: "center", valign: "middle" } },
      { content: "+", styles: { halign: "center", fontStyle: "bold", fontSize: 13, valign: "middle" } },
      { content: "Valor Final del Título Segundo\nbebés, niños, niñas\n(mayores de 3 años)", styles: { halign: "center", valign: "middle" } },
    ]],
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 10 },
      2: { cellWidth: 52 },
      3: { cellWidth: 10 },
      4: { cellWidth: 58 },
    },
  });
  y = doc.lastAutoTable.finalY + 5;

  // Otros fundamentos de derecho (lista normativa)
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bold");
  const otrosFundLines = doc.splitTextToSize(
    "Otros fundamentos de derecho que se tuvieron en cuenta para el presente dictamen se encuentran en las siguientes normas:",
    CW
  );
  for (const ln of otrosFundLines) { if (y > 271) y = nuevaPag(doc, logo, numDict); doc.text(ln, MARGIN_L, y); y += 4.5; }
  y += 2;
  doc.setFont(getPdfFont(), "normal");
  const OTRAS_NORMAS = [
    "Ley 100 de 1993, crea las Juntas de Calificación.",
    "Decreto Ley 19/2012 Art.142",
    "Decreto 1295 de 1994 y Ley 776 de 2002, reglamentan el Sistema General de Riesgos Profesionales (SGRP)",
    "Decreto 2463 de 2001, reglamenta el funcionamiento y competencia de las Juntas de Calificación. Derogado por el Decreto 1352 de 26 de junio de 2013",
    "Ley 1562 de 2012.",
    "Decreto 1507 de 2014.",
  ];
  for (const norma of OTRAS_NORMAS) {
    if (y > 260) y = nuevaPag(doc, logo, numDict);
    const nLines = doc.splitTextToSize(norma, CW);
    for (const ln of nLines) { if (y > 271) y = nuevaPag(doc, logo, numDict); doc.text(ln, MARGIN_L, y); y += 4.5; }
  }
  y += 5;

  // ────────────────────────────────────────────────────────────────
  // 5.8 ANÁLISIS Y CONCLUSIONES — sub-sección dentro de la sección 5
  // ────────────────────────────────────────────────────────────────
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(9);
  doc.setFont(getPdfFont(), "bold");
  doc.setTextColor(...C.secondary);
  doc.text("Análisis y Conclusiones:", MARGIN_L, y);
  doc.setTextColor(...C.dark);
  y += 6;

  if (evaluacion.analisisConclusiones) {
    doc.setFontSize(8.5);
    doc.setFont(getPdfFont(), "normal");
    const acLines = doc.splitTextToSize(stripHtml(evaluacion.analisisConclusiones), CW);
    for (const ln of acLines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(ln, MARGIN_L, y); y += 4.5;
    }
    y += 5;
  } else {
    doc.setFontSize(8.5);
    doc.setFont(getPdfFont(), "italic");
    doc.text("No registrado.", MARGIN_L, y);
    doc.setFont(getPdfFont(), "normal");
    y += 8;
  }

  // ────────────────────────────────────────────────────────────────
  // 5.9 Resumen final del dictamen (estilo oficial JNCI)
  // ────────────────────────────────────────────────────────────────
  if (y > 258) y = nuevaPag(doc, logo, numDict);
  doc.setDrawColor(...C.secondary); doc.setLineWidth(0.5);
  doc.line(MARGIN_L, y, PW - MARGIN_R, y); y += 4;

  // Lista de diagnósticos numerada
  doc.setFontSize(9); doc.setFont(getPdfFont(), "bold");
  doc.text("DIAGNÓSTICOS:", MARGIN_L, y); y += 6;

  const dxAll = [];
  if (evaluacion.diagnosticoPrincipal?.codigo) {
    dxAll.push(`${stripHtml(evaluacion.diagnosticoPrincipal.nombre || "")} (${evaluacion.diagnosticoPrincipal.codigo})`);
  }
  (evaluacion.diagnosticosSecundarios || []).forEach(d => {
    if (d.codigo) dxAll.push(`${stripHtml(d.nombre || "")} (${d.codigo})`);
  });

  doc.setFontSize(8.5); doc.setFont(getPdfFont(), "normal");
  dxAll.forEach((txt, i) => {
    if (y > 260) y = nuevaPag(doc, logo, numDict);
    const lineas = doc.splitTextToSize(`${i + 1}. ${txt}`, CW - 8);
    lineas.forEach(ln => { doc.text(ln, MARGIN_L + 8, y); y += 4.5; });
  });
  y += 4;

  // PCL totales
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  doc.setFontSize(9); doc.setFont(getPdfFont(), "bold");
  doc.text("PÉRDIDA DE CAPACIDAD LABORAL", MARGIN_L, y); y += 5;
  doc.setFontSize(8.5);
  const pclSummaryRows = [
    ["DEFICIENCIAS:", `${evaluacion.deficiencia ?? 0}%`],
    ["ROL LABORAL / OCUPACIONAL:", `${_totalTII.toFixed(2)}%`],
    ["TOTAL, PCLO:", `${evaluacion.porcentajePCL ?? 0}%   (DECRETO 1507 DE 2014)`],
  ];
  pclSummaryRows.forEach(([lbl, val]) => {
    if (y > 271) y = nuevaPag(doc, logo, numDict);
    doc.setFont(getPdfFont(), "bold");   doc.text(lbl, MARGIN_L, y);
    doc.setFont(getPdfFont(), "normal"); doc.text(val, MARGIN_L + 62, y);
    y += 5;
  });
  y += 2;

  doc.setFont(getPdfFont(), "bold"); doc.text("ORIGEN:", MARGIN_L, y);
  doc.setFont(getPdfFont(), "normal");
  doc.text(`${(v(evaluacion.origen) || "").toUpperCase()}`, MARGIN_L + 30, y);
  y += 5;
  doc.setFont(getPdfFont(), "bold"); doc.text("FECHA DE ESTRUCTURACIÓN:", MARGIN_L, y);
  doc.setFont(getPdfFont(), "normal");
  doc.text(`${fmtFecha(evaluacion.fechaEstructuracion)}`, MARGIN_L + 68, y);
  y += 7;

  doc.setFont(getPdfFont(), "italic"); doc.setFontSize(8.5);
  const notifLines = doc.splitTextToSize(
    "En consecuencia, notifíquese el dictamen emitido a las partes interesadas en los términos del artículo 41 del Decreto 1352 de 2013.",
    CW
  );
  notifLines.forEach(ln => {
    if (y > 271) y = nuevaPag(doc, logo, numDict);
    doc.text(ln, MARGIN_L, y); y += 4.5;
  });
  doc.setFont(getPdfFont(), "normal");
  y += 5;

  doc.setDrawColor(...C.secondary); doc.setLineWidth(0.5);
  doc.line(MARGIN_L, y, PW - MARGIN_R, y); y += 4;

  // 6. Diagnósticos
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "6. DIAGNÓSTICOS CIE-11", y);

  const diagRows = [];
  if (evaluacion.diagnosticoPrincipal) {
    diagRows.push([
      { content: "Principal", styles: { fillColor: [220, 237, 251], fontStyle: "bold" } },
      evaluacion.diagnosticoPrincipal.codigo || "N/A",
      stripHtml(evaluacion.diagnosticoPrincipal.nombre) || "N/A",
    ]);
  }
  (evaluacion.diagnosticosSecundarios || []).forEach((d, i) => {
    diagRows.push([
      `Secundario ${i + 1}`,
      d.codigo || "N/A",
      stripHtml(d.nombre) || "N/A",
    ]);
  });

  autoTable(doc, {
    ...tblOpts({ theme: "striped" }),
    startY: y,
    head: [["Tipo", "Código", "Diagnóstico"]],
    body: diagRows.length > 0 ? diagRows : [["—", "—", "Sin diagnósticos registrados"]],
    headStyles: { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 32 }, 2: { cellWidth: 128 } },
  });
  y = doc.lastAutoTable.finalY + 5;

  // ────────────────────────────────────────────────────────────────
  // SECCIÓN 7 — CALIFICACIÓN PCL (TÍTULOS I Y II)
  // ────────────────────────────────────────────────────────────────
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "7. CALIFICACIÓN DE PÉRDIDA DE CAPACIDAD LABORAL — Decreto 1507/2014", y);

  // 7.1 Título I — Deficiencia
  y = subHeader(doc, "7.1  Título I — Calificación / Valoración de las deficiencias  (máx. 50%)", y, { fillColor: [210, 220, 235] });

  // ── 7.1.a  Diagnósticos y origen ─────────────────────────────────
  {
    const dx = [];
    if (evaluacion.diagnosticoPrincipal?.codigo) {
      dx.push([
        evaluacion.diagnosticoPrincipal.codigo,
        evaluacion.diagnosticoPrincipal.nombre || "",
        evaluacion.diagnosticoPrincipal.diagnosticoEspecifico || "",
        evaluacion.diagnosticoPrincipal.fechaDiagnostico
          ? fmtFecha(evaluacion.diagnosticoPrincipal.fechaDiagnostico) : "",
        evaluacion.diagnosticoPrincipal.origen || evaluacion.origen || "Enfermedad común",
      ]);
    }
    (evaluacion.diagnosticosSecundarios || []).forEach((d) => {
      if (d.codigo) dx.push([
        d.codigo,
        d.nombre || "",
        d.diagnosticoEspecifico || "",
        d.fechaDiagnostico ? fmtFecha(d.fechaDiagnostico) : "",
        d.origen || evaluacion.origen || "Enfermedad común",
      ]);
    });

    y = subHeader(doc, "Diagnósticos y origen", y, { fillColor: [220, 228, 240] });

    autoTable(doc, {
      ...tblOpts({ theme: "striped" }),
      startY: y,
      head: [["CIE-11", "Diagnóstico", "Diagnóstico específico", "Fecha", "Origen"]],
      body: dx.length > 0 ? dx : [["—", "Sin diagnósticos registrados", "", "", ""]],
      headStyles: { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
      styles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 56 },
        2: { cellWidth: 46 },
        3: { cellWidth: 28 },
        4: { cellWidth: 34 },
      },
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  // ── 7.1.b  Deficiencias agrupadas por capítulo ────────────────────
  {
    const defs = evaluacion.detalleDeficiencias || [];

    if (defs.length === 0) {
      // Fallback: evaluacion sin detalle de deficiencias
      y = subHeader(doc, "Deficiencias", y, { fillColor: [220, 228, 240] });
      autoTable(doc, {
        ...tblOpts({ theme: "grid", cellPadding: 1.5 }),
        startY: y,
        head: [["Deficiencia", "Cap.", "Tabla", "CFP", "CFM1", "CFM2", "CFM3", "Valor", "CAT", "Total"]],
        body: [["Sin deficiencias registradas", "—", "—", "—", "—", "—", "—", "0%", "—", "0%"]],
        headStyles: { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 62 },
          1: { cellWidth: 16, halign: "center" }, 2: { cellWidth: 14, halign: "center" },
          3: { cellWidth: 12, halign: "center" }, 4: { cellWidth: 13, halign: "center" },
          5: { cellWidth: 13, halign: "center" }, 6: { cellWidth: 13, halign: "center" },
          7: { cellWidth: 15, halign: "center" }, 8: { cellWidth: 12, halign: "center" },
          9: { cellWidth: 12, halign: "center" },
        },
      });
      y = doc.lastAutoTable.finalY + 5;
    } else {
      // Agrupar por capítulo (preservando orden de inserción)
      const capMap = new Map();
      for (const d of defs) {
        const cap = d.capitulo || "Sin capítulo";
        if (!capMap.has(cap)) capMap.set(cap, []);
        capMap.get(cap).push(d);
      }

      y = subHeader(doc, "Deficiencias", y, { fillColor: [220, 228, 240] });

      const DEF_COL = {
        0: { cellWidth: 62 },
        1: { cellWidth: 16, halign: "center" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 12, halign: "center" },
        4: { cellWidth: 13, halign: "center" },
        5: { cellWidth: 13, halign: "center" },
        6: { cellWidth: 13, halign: "center" },
        7: { cellWidth: 15, halign: "center" },
        8: { cellWidth: 12, halign: "center" },
        9: { cellWidth: 12, halign: "center" },
      };
      const DEF_HEAD = [["Deficiencia", "Cap.", "Tabla", "CFP", "CFM1", "CFM2", "CFM3", "Valor", "CAT", "Total"]];
      const DEF_HEAD_STYLE = { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 7.5 };

      const capResults = [];

      for (const [cap, capDefs] of capMap) {
        if (y > 255) y = nuevaPag(doc, logo, numDict);

        const rows = capDefs.map((d) => {
          const cfm = d.cfmDetalle;
          const cfm1 = cfm?.cfm1 ? `+${cfm.cfm1.valor}` : "—";
          const cfm2 = cfm?.cfm2 ? `+${cfm.cfm2.valor}` : "—";
          const cfm3 = cfm?.cfm3 ? `+${cfm.cfm3.valor}` : "—";
          const cfpBase = cfm ? (d.valorAsignado - (cfm.cfmTotal ?? 0)) : (d.valorAsignado ?? 0);
          return [
            d.descripcion || d.claseDescripcion || "",
            (d.capitulo || "").replace("Cap. ", ""),
            d.tabla || "—",
            `${cfpBase}%`,
            cfm1, cfm2, cfm3,
            `${d.valorAsignado ?? 0}%`,
            d.clase || "—",
            `${d.valorAsignado ?? 0}%`,
          ];
        });

        // Combinar Baltazar dentro del capítulo
        const { total: capTotal } = combinarBalthazard(capDefs.map((d) => d.valorAsignado ?? 0));
        capResults.push({ cap, capTotal: Math.round(capTotal * 100) / 100 });

        // Fila de "Valor combinado" al final de las filas
        const combinadoRow = [
          {
            content: `Valor combinado  ${capTotal.toFixed(2)}%`,
            colSpan: 10,
            styles: { halign: "right", fontStyle: "bold", fillColor: C.header, textColor: C.dark },
          },
        ];

        autoTable(doc, {
          ...tblOpts({ theme: "grid", cellPadding: 1.5 }),
          startY: y,
          head: DEF_HEAD,
          body: [...rows, combinadoRow],
          headStyles: DEF_HEAD_STYLE,
          styles: { fontSize: 7.5, cellPadding: 1.5 },
          columnStyles: DEF_COL,
        });
        y = doc.lastAutoTable.finalY + 2;
      }

      // ── Tabla resumen por capítulo ──────────────────────────────
      if (y > 252) y = nuevaPag(doc, logo, numDict);
      const resumenRows = capResults.map(({ cap, capTotal }) => [capNombre(cap), `${capTotal.toFixed(2)}%`]);

      // Calcular valor sin ponderar combinando capítulos con Baltazar
      const { total: sinPonderar } = combinarBalthazard(capResults.map((r) => r.capTotal));
      const sinPonderarRound = Math.round(sinPonderar * 100) / 100;

      autoTable(doc, {
        ...tblOpts({ theme: "plain" }),
        startY: y,
        head: [["Capítulo", "Valor deficiencia"]],
        body: resumenRows,
        foot: [[
          { content: "Valor final de la combinación de deficiencias sin ponderar", styles: { fontStyle: "bold", fillColor: C.lightBg } },
          { content: `${sinPonderarRound.toFixed(2)}%`, styles: { fontStyle: "bold", fillColor: [200, 220, 200], halign: "center" } },
        ]],
        headStyles: { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 8 },
        footStyles: { fontSize: 8.5 },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 148 }, 1: { cellWidth: 34, halign: "center" } },
      });
      y = doc.lastAutoTable.finalY + 4;

      // ── Notas de fórmula Baltazar ───────────────────────────────
      if (y > 255) y = nuevaPag(doc, logo, numDict);
      doc.setFontSize(7.5);
      doc.setFont(getPdfFont(), "normal");
      doc.setTextColor(...C.gray);
      const formulaLines = doc.splitTextToSize(
        "CFP: Clase factor principal   CFM: Clase factor modulador   |   Fórmula Baltazar: A + (100 − A) × B / 100   |   A: Deficiencia mayor valor. B: Deficiencia menor valor.",
        CW
      );
      for (const ln of formulaLines) { if (y > 271) y = nuevaPag(doc, logo, numDict); doc.text(ln, MARGIN_L, y); y += 4; }
      doc.setTextColor(...C.dark);
      y += 3;

      // ── Calculo final de la deficiencia ponderada ──────────────
      const defPonderada = evaluacion.deficiencia ?? Math.round(sinPonderarRound * 0.5 * 100) / 100;
      autoTable(doc, {
        ...tblOpts({ theme: "plain" }),
        startY: y,
        body: [[
          { content: "Calculo final de la deficiencia ponderada:  % Total deficiencia (sin ponderar) × 0,5", styles: { fontStyle: "bold", fontSize: 8.5, fillColor: C.lightBg } },
          { content: `${defPonderada.toFixed(2)}%`, styles: { fontStyle: "bold", fontSize: 9, fillColor: C.success, textColor: C.white, halign: "center" } },
        ]],
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 148 }, 1: { cellWidth: 34, halign: "center" } },
      });
      y = doc.lastAutoTable.finalY + 7;
    }
  }

  // ── Motor de consistencia (entre Título I y Título II) ────────────
  {
    const sugerencias = _calcularSugerenciasConsistencia(evaluacion.detalleDeficiencias, avds);
    if (y > 258) y = nuevaPag(doc, logo, numDict);

    if (sugerencias.length === 0) {
      doc.setFillColor(39, 174, 96);
      doc.rect(MARGIN_L, y, CW, 7, "F");
      doc.setFontSize(8);
      doc.setFont(getPdfFont(), "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("✓  Motor de consistencia CIF: todos los dominios valorados coherentemente con las deficiencias registradas.", MARGIN_L + 3, y + 5);
      doc.setTextColor(...C.dark);
      y += 11;
    } else {
      // Cabecera ámbar
      doc.setFillColor(230, 155, 0);
      doc.rect(MARGIN_L, y, CW, 7, "F");
      doc.setFontSize(8);
      doc.setFont(getPdfFont(), "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(
        `⚠  Motor de consistencia CIF: ${sugerencias.length} dominio${sugerencias.length > 1 ? "s" : ""} sin puntuar — revisar coherencia con deficiencias.`,
        MARGIN_L + 3, y + 5
      );
      doc.setTextColor(...C.dark);
      y += 9;

      const consistRows = sugerencias.map(({ nombre, causas, urgencia }) => [
        urgencia === 'alta' ? 'ALTA' : 'MEDIA',
        nombre,
        (causas || []).join('; ') || '—',
      ]);

      autoTable(doc, {
        ...tblOpts({ theme: "grid", cellPadding: 2 }),
        startY: y,
        head: [["Urgencia", "Dominio CIF sin puntuar", "Deficiencias relacionadas"]],
        body: consistRows,
        headStyles: { fillColor: [200, 135, 0], textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
        styles: { fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 20, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 62 },
          2: { cellWidth: 100 },
        },
        didParseCell: (data) => {
          if (data.column.index === 0 && data.section === 'body') {
            data.cell.styles.textColor = data.cell.raw === 'ALTA' ? [180, 0, 0] : [120, 80, 0];
          }
        },
      });
      y = doc.lastAutoTable.finalY + 4;
    }
  }

  // 7.2 Título II
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  y = subHeader(doc, "7.2  Título II — Valoración del rol laboral, rol ocupacional y otras áreas ocupacionales  (máx. 50%)", y, { fillColor: [210, 220, 235] });
  y = subHeader(doc, "Rol laboral", y, { fillColor: [220, 228, 240], centered: true });

  const totalRL = (rl.totalRolLaboral !== undefined)
    ? rl.totalRolLaboral
    : (rl.restriccionesRolLaboral ?? 0) + (rl.restriccionesAutosuficiencia ?? 0) + (rl.restriccionesEdad ?? 0);

  // Construir filas detalladas del rol laboral con ítems del checklist
  const ROL_ITEMS_NOMBRES = {
    rl1: "Esfuerzo físico intenso (≥ 25 lb)", rl2: "Bipedestación o marcha prolongada",
    rl3: "Movimientos repetitivos MMSS/tronco", rl4: "Exposición a agentes físicos adversos",
    rl5: "Exposición a agentes químicos",       rl6: "Maquinaria peligrosa o trabajo en alturas",
    rl7: "Conducción de vehículos de trabajo",  rl8: "Concentración sostenida / decisiones complejas",
    rl9: "Interacción social requerida por el rol", rl10: "Restricción global laboral",
  };
  const AUTOSUF_NOMBRES = {
    as1: "No puede manejar dinero o transacciones",
    as2: "Dependencia económica de terceros para básicos",
    as3: "Pérdida total de capacidad de generar ingresos",
  };

  const rlItems  = rl.restriccionesRolLaboralItems || [];
  const asItems  = rl.restriccionesAutosuficienciaItems || [];
  const rlDetalle = rlItems.map(id => `  • ${ROL_ITEMS_NOMBRES[id] || id}`).join("\n") || "  (ninguna marcada)";
  const asDetalle = asItems.map(id => `  • ${AUTOSUF_NOMBRES[id] || id}`).join("\n") || "  (ninguna marcada)";

  const edadBandas = [
    { maxEdad: 35, puntos: 0, label: "≤ 35 años" }, { maxEdad: 45, puntos: 2, label: "36–45 años" },
    { maxEdad: 55, puntos: 4, label: "46–55 años" }, { maxEdad: Infinity, puntos: 6, label: "> 55 años" },
  ];
  const edadPuntos = rl.restriccionesEdad ?? 0;
  const edadBanda = edadBandas.find(b => edadPuntos === b.puntos)?.label || `${edadPuntos} pts`;

  autoTable(doc, {
    ...tblOpts({ theme: "striped" }),
    startY: y,
    head: [["Componente del Rol Laboral", "Pts"]],
    body: [
      [
        { content: `Sección A — Restricciones del rol laboral\n${rlDetalle}`,
          styles: { fontStyle: "normal", cellPadding: { top: 2, bottom: 2, left: 3, right: 1 } } },
        `${rl.restriccionesRolLaboral ?? 0}`,
      ],
      [
        { content: `Sección B — Restricciones de autosuficiencia económica\n${asDetalle}`,
          styles: { fontStyle: "normal", cellPadding: { top: 2, bottom: 2, left: 3, right: 1 } } },
        `${rl.restriccionesAutosuficiencia ?? 0}`,
      ],
      [
        { content: `Sección C — Restricciones por edad cronológica (${edadBanda})`,
          styles: { fontStyle: "normal" } },
        `${edadPuntos}`,
      ],
    ],
    foot: [[
      { content: "Sumatoria rol laboral, autosuficiencia económica y edad (máx. 30%)", styles: { fontStyle: "bold", halign: "left", fillColor: C.header } },
      { content: `${totalRL.toFixed(2)}%`, styles: { fontStyle: "bold", fillColor: C.success, textColor: C.white, halign: "center" } },
    ]],
    headStyles: { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 8.5 },
    footStyles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 152 }, 1: { cellWidth: 30, halign: "center" } },
  });
  y = doc.lastAutoTable.finalY + 5;

  // 7.2.2 AVDs CIF — tabla compacta estilo oficial
  if (y > 252) y = nuevaPag(doc, logo, numDict);

  let sumaAVDs = 0;
  const avdGridBody = [];
  const itemColW = (CW - 8 - 38 - 20) / 10; // 116/10 = 11.6mm por sub-ítem

  // ── Encabezado global
  avdGridBody.push([{
    content: 'Calificación otras áreas ocupacionales (AVD)',
    colSpan: 13,
    styles: { halign: 'center', fontStyle: 'bold', fillColor: C.secondary, textColor: C.white, fontSize: 9 },
  }]);

  // ── Leyenda fila 1: A / B / C
  avdGridBody.push([
    { content: 'A', styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 235, 250] } },
    { content: '0,0', styles: { halign: 'center', fillColor: [220, 235, 250] } },
    { content: 'No hay dificultad, no dependencia.', colSpan: 2, styles: { fillColor: [220, 235, 250] } },
    { content: 'B', styles: { halign: 'center', fontStyle: 'bold', fillColor: [210, 240, 215] } },
    { content: '0,1', styles: { halign: 'center', fillColor: [210, 240, 215] } },
    { content: 'Dificultad leve, no dependencia.', colSpan: 2, styles: { fillColor: [210, 240, 215] } },
    { content: 'C', styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 245, 200] } },
    { content: '0,2', styles: { halign: 'center', fillColor: [255, 245, 200] } },
    { content: 'Dificultad moderada, dependencia moderada.', colSpan: 3, styles: { fillColor: [255, 245, 200], fontSize: 6.5 } },
  ]);

  // ── Leyenda fila 2: D / E
  avdGridBody.push([
    { content: 'D', styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 220, 180] } },
    { content: '0,3', styles: { halign: 'center', fillColor: [255, 220, 180] } },
    { content: 'Dificultad severa, dependencia severa.', colSpan: 4, styles: { fillColor: [255, 220, 180] } },
    { content: 'E', styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 200, 200] } },
    { content: '0,4', styles: { halign: 'center', fillColor: [255, 200, 200] } },
    { content: 'Dificultad completa, dependencia completa.', colSpan: 5, styles: { fillColor: [255, 200, 200] } },
  ]);

  // ── Filas de datos por dominio (2 filas por dominio con rowSpan)
  AVD_DOMS.forEach(dom => {
    const domData = avds[dom.id] || {};
    const domSuma = dom.items.reduce((s, it) => s + (parseFloat(domData[it.id]) || 0), 0);
    sumaAVDs += domSuma;
    const domSumaR = Math.round(domSuma * 100) / 100;

    // Fila A: número y código de sub-ítem (domain code+name con rowSpan:2)
    avdGridBody.push([
      { content: dom.label, rowSpan: 2, styles: { halign: 'center', fontStyle: 'bold', valign: 'middle', fillColor: C.header, fontSize: 8 } },
      { content: dom.nombre, rowSpan: 2, styles: { fontStyle: 'bold', valign: 'middle', fontSize: 7.5, fillColor: C.header } },
      ...dom.items.map(it => ({
        content: `${it.num}\n${it.id}`,
        styles: { halign: 'center', fontSize: 6.5, cellPadding: 1.5 },
      })),
      { content: 'Total', styles: { halign: 'center', fontStyle: 'bold', fillColor: C.header, fontSize: 7.5 } },
    ]);

    // Fila B: valores (cols 0 y 1 ocupados por rowSpan de fila A, col 12 = subtotal)
    avdGridBody.push([
      ...dom.items.map(it => {
        const val = parseFloat(domData[it.id]) || 0;
        return {
          content: val > 0 ? String(val) : '0',
          styles: {
            halign: 'center',
            fontSize: 7.5,
            fontStyle: val > 0 ? 'bold' : 'normal',
            textColor: val > 0 ? C.primary : C.dark,
          },
        };
      }),
      { content: String(domSumaR), styles: { halign: 'center', fontStyle: 'bold', fillColor: C.header, fontSize: 8 } },
    ]);
  });

  const totalAVD = Math.min(Math.round(sumaAVDs * 100) / 100, 20);

  autoTable(doc, {
    ...tblOpts({ theme: 'grid' }),
    startY: y,
    body: avdGridBody,
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0:  { cellWidth: 8,         halign: 'center' },
      1:  { cellWidth: 38 },
      2:  { cellWidth: itemColW },
      3:  { cellWidth: itemColW },
      4:  { cellWidth: itemColW },
      5:  { cellWidth: itemColW },
      6:  { cellWidth: itemColW },
      7:  { cellWidth: itemColW },
      8:  { cellWidth: itemColW },
      9:  { cellWidth: itemColW },
      10: { cellWidth: itemColW },
      11: { cellWidth: itemColW },
      12: { cellWidth: 20 },
    },
    foot: [[
      { content: 'Sumatoria total de otras áreas ocupacionales (20%):', colSpan: 12, styles: { fontStyle: 'bold', halign: 'right', fillColor: C.header } },
      { content: `${totalAVD}`, styles: { fontStyle: 'bold', fillColor: C.success, textColor: C.white, halign: 'center' } },
    ]],
    footStyles: { fontSize: 9 },
  });
  y = doc.lastAutoTable.finalY + 2;

  // Fila "Valor final título II" (estilo guía JNCI)
  const totalTII = Math.round((totalRL + totalAVD) * 100) / 100;
  autoTable(doc, {
    ...tblOpts({ theme: "plain" }),
    startY: y,
    body: [[
      { content: "Valor final título II", styles: { fontStyle: "bold", halign: "right", fillColor: C.lightBg } },
      { content: `${totalTII.toFixed(2)}%`, styles: { fontStyle: "bold", fillColor: C.secondary, textColor: C.white, halign: "center" } },
    ]],
    styles: { cellPadding: 2.5, lineWidth: 0.3, lineColor: [120, 130, 140] },
    columnStyles: { 0: { cellWidth: 162 }, 1: { cellWidth: 20 } },
  });
  y = doc.lastAutoTable.finalY + 5;

  // 7.3 Concepto final del dictamen — la tabla interna se parte sola; solo necesitamos header + 1 fila (~30mm)
  if (y > 255) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "7.3  CONCEPTO FINAL DEL DICTAMEN", y);
  y = subHeader(doc, "Resumen de la calificación PCL", y, { fillColor: [210, 220, 235] });

  autoTable(doc, {
    ...tblOpts(),
    startY: y,
    body: [
      // TI
      [
        { content: "Valor final de la deficiencia (Ponderado) — Título I", colSpan: 3,
          styles: { fontStyle: "bold", fillColor: C.header } },
        { content: `${evaluacion.deficiencia ?? 0}%`, styles: { fontStyle: "bold", halign: "center" } },
      ],
      // TII
      [
        { content: "Valor final del rol laboral, ocupacional y otras áreas — Título II", colSpan: 3,
          styles: { fontStyle: "bold", fillColor: C.header } },
        { content: `${totalTII.toFixed(2)}%`, styles: { fontStyle: "bold", halign: "center" } },
      ],
      // PCL Total — fila prominente
      [
        { content: "Pérdida de la capacidad laboral y ocupacional (Título I + Título II)", colSpan: 3,
          styles: { fontStyle: "bold", fontSize: 10, fillColor: C.secondary, textColor: C.white, halign: "left" } },
        { content: `${evaluacion.porcentajePCL ?? 0}%`,
          styles: { fontStyle: "bold", fontSize: 14, fillColor: C.secondary, textColor: C.white, halign: "center" } },
      ],
      // Nivel pérdida / Muerte
      [
        { content: "Nivel de Pérdida",    styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.nivelPerdida),
        { content: "Muerte",              styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.muerte ? `Sí  (${fmtFecha(evaluacion.fechaDefuncion)})` : "No",
      ],
      // Origen / Riesgo
      [
        { content: "Origen de la Patología", styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.origen),
        { content: "Tipo de Riesgo",         styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.riesgo),
      ],
      // Fechas
      [
        { content: "Fecha de Estructuración", styles: { fontStyle: "bold", fillColor: C.header } }, fmtFecha(evaluacion.fechaEstructuracion),
        { content: "Fecha de Declaratoria",   styles: { fontStyle: "bold", fillColor: C.header } }, fmtFecha(evaluacion.fechaDeclaratoria),
      ],
      // Ayuda terceros
      [
        { content: "Ayuda de Terceros (ABC)", styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.ayudaTercerosABC ? "Sí" : "No",
        { content: "Ayuda para Decisiones",   styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.ayudaTercerosDecisiones ? "Sí" : "No",
      ],
      // Dispositivos / alto costo
      [
        { content: "Dispositivos de Apoyo",  styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.requiereDispositivosApoyo ? "Sí" : "No",
        { content: "Enfermedad Alto Costo",  styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.enfermedadAltoCosto ? "Sí" : "No",
      ],
      // Degenerativa / progresiva
      [
        { content: "Enfermedad Degenerativa", styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.enfermedadDegenerativa ? "Sí" : "No",
        { content: "Enfermedad Progresiva",   styles: { fontStyle: "bold", fillColor: C.header } }, evaluacion.enfermedadProgresiva ? "Sí" : "No",
      ],
      // Calificación integral / decisión JRCI
      [
        { content: "Calificación Integral", styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.calificacionIntegral),
        { content: "Decisión JRCI",         styles: { fontStyle: "bold", fillColor: C.header } }, v(evaluacion.decisionJRCI),
      ],
    ],
    columnStyles: colStyle4,
  });
  y = doc.lastAutoTable.finalY + 5;

  if (evaluacion.sustentacionFechaEstructuracion) {
    if (y > 255) y = nuevaPag(doc, logo, numDict);
    doc.setFontSize(8.5);
    doc.setFont(getPdfFont(), "bold");
    doc.text("Sustentación de la Fecha de Estructuración:", MARGIN_L, y + 5);
    y += 8;
    doc.setFont(getPdfFont(), "normal");
    const sLines = doc.splitTextToSize(evaluacion.sustentacionFechaEstructuracion, CW);
    doc.text(sLines, MARGIN_L, y);
    y += sLines.length * 4.5 + 5;
  }

  y += 2;

  // 9. Observaciones y Recomendaciones
  if (y > 258) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "8. OBSERVACIONES Y RECOMENDACIONES", y);

  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "bold");
  doc.text("Observaciones:", MARGIN_L, y);
  y += 5;
  doc.setFont(getPdfFont(), "normal");
  if (evaluacion.observaciones) {
    const oLines = doc.splitTextToSize(evaluacion.observaciones, CW);
    for (const ln of oLines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(ln, MARGIN_L, y); y += 4.5;
    }
    y += 4;
  } else {
    doc.setFont(getPdfFont(), "italic");
    doc.text("Sin observaciones.", MARGIN_L, y);
    doc.setFont(getPdfFont(), "normal");
    y += 8;
  }

  doc.setFont(getPdfFont(), "bold");
  doc.text("Recomendaciones:", MARGIN_L, y);
  y += 5;
  doc.setFont(getPdfFont(), "normal");
  if (evaluacion.recomendaciones) {
    if (y > 255) y = nuevaPag(doc, logo, numDict);
    const rLines = doc.splitTextToSize(evaluacion.recomendaciones, CW);
    for (const ln of rLines) {
      if (y > 271) y = nuevaPag(doc, logo, numDict);
      doc.text(ln, MARGIN_L, y); y += 4.5;
    }
    y += 7;
  } else {
    doc.setFont(getPdfFont(), "italic");
    doc.text("Sin recomendaciones.", MARGIN_L, y);
    doc.setFont(getPdfFont(), "normal");
    y += 8;
  }

  // 10. Firmas — necesita ~90mm; umbral conservador para evitar overflow sobre el footer
  if (y > 185) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "9. FIRMA Y VALIDACIÓN DEL DICTAMEN", y);

  // Datos del médico: usa perfil actual del usuario logueado como fuente primaria
  const mc = evaluacion.medicoCalificador || {};
  const perfilUsuario = JSON.parse(localStorage.getItem("user") || "{}");
  const datosProfPerfil = perfilUsuario.datosProfesionales || {};

  const nombreMedico   = perfilUsuario.name               || mc.nombre              || evaluacion.medicoEvaluador?.name || "N/A";
  const cedulaMedico   = perfilUsuario.cedula              || mc.cedula              || "";
  const correoMedico   = perfilUsuario.email               || mc.correoElectronico   || "";
  const regProfesional = datosProfPerfil.registroProfesional || mc.registroProfesional || "";
  const especialidad   = datosProfPerfil.especialidad      || mc.especialidad        || "";

  doc.setFontSize(8.5);
  doc.setFont(getPdfFont(), "normal");
  doc.text(`Médico Calificador:  ${nombreMedico}`, MARGIN_L, y);
  y += 5;
  if (regProfesional) { doc.text(`Reg. Profesional:  ${regProfesional}`, MARGIN_L, y); y += 5; }
  if (cedulaMedico)   { doc.text(`Cédula:  ${cedulaMedico}`, MARGIN_L, y); y += 5; }
  if (especialidad)   { doc.text(`Especialidad:  ${especialidad}`, MARGIN_L, y); y += 5; }
  if (correoMedico)   { doc.text(`Correo:  ${correoMedico}`, MARGIN_L, y); y += 5; }
  doc.text(`Fecha de Evaluación:  ${fmtFecha(evaluacion.fechaEvaluacion)}`, MARGIN_L, y);
  y += 5;
  doc.text(`Estado del Dictamen:  ${v(evaluacion.estado)}`, MARGIN_L, y);
  y += 22;

  // Líneas de firma
  const sw = 65;
  const gap = 12;
  const sx1 = MARGIN_L;
  const sx2 = sx1 + sw + gap;

  doc.setDrawColor(...C.secondary);
  doc.setLineWidth(0.4);
  doc.line(sx1, y, sx1 + sw, y);
  doc.line(sx2, y, sx2 + sw, y);

  // Izquierda: nombre primero (bold), luego registro, luego rol
  doc.setFontSize(8);
  doc.setFont(getPdfFont(), "bold");
  doc.text(nombreMedico, sx1 + sw / 2, y + 6, { align: "center" });

  doc.setFont(getPdfFont(), "normal");
  let offsetFirmaY = y + 11;
  if (regProfesional) {
    doc.setFontSize(7.5);
    doc.text(regProfesional, sx1 + sw / 2, offsetFirmaY, { align: "center" });
    offsetFirmaY += 5;
    doc.setFontSize(8);
  }
  doc.setFont(getPdfFont(), "italic");
  doc.text("Médico Calificador", sx1 + sw / 2, offsetFirmaY, { align: "center" });
  doc.setFont(getPdfFont(), "normal");

  // Derecha: coordinador/revisor
  doc.setFontSize(8);
  doc.text("Nombre y firma", sx2 + sw / 2, y + 6, { align: "center" });
  doc.setFont(getPdfFont(), "italic");
  doc.text("Coordinador / Revisor", sx2 + sw / 2, y + 11, { align: "center" });
  doc.setFont(getPdfFont(), "normal");

  // Logo al lado de las firmas
  if (logo) {
    const maxW2 = 44; const maxH2 = 17;
    let w2 = maxH2 * logo.ratio; let h2 = maxH2;
    if (w2 > maxW2) { w2 = maxW2; h2 = w2 / logo.ratio; }
    doc.addImage(logo.dataUrl, "JPEG", sx2 + sw + gap, y - h2, w2, h2);
  }
  y += 22;

  // ── GRUPO CALIFICADOR ────────────────────────────────────────────
  if (y > 252) y = nuevaPag(doc, logo, numDict);
  y = secTitle(doc, "10. GRUPO CALIFICADOR", y);

  const grupoRows = [];
  grupoRows.push([
    nombreMedico,
    especialidad || "Médico Calificador",
    cedulaMedico,
    regProfesional,
  ]);

  autoTable(doc, {
    ...tblOpts({ theme: "striped" }),
    startY: y,
    head: [["Nombre", "Cargo / Especialidad", "Cédula", "Reg. Profesional"]],
    body: grupoRows,
    headStyles: { fillColor: C.secondary, textColor: C.white, fontStyle: "bold", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 68 },
      1: { cellWidth: 60 },
      2: { cellWidth: 28 },
      3: { cellWidth: 26 },
    },
  });
  y = doc.lastAutoTable.finalY + 5;

  // ────────────────────────────────────────────────────────────────
  // APLICAR PIE DE PÁGINA EN TODAS LAS PÁGINAS
  // ────────────────────────────────────────────────────────────────
  const nombreFooter = datosProfPerfil.nombrePiePagina || nombreMedico;
  addFooters(doc, numDict, p.nombreCompleto || "N/A", nombreFooter);

  // ────────────────────────────────────────────────────────────────
  // GUARDAR
  // ────────────────────────────────────────────────────────────────
  const nombre = `Dictamen_PCL_${p.cedula || "SIN_CC"}_${numDict}.pdf`;
  doc.save(nombre);
};