import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Función para limpiar HTML
const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, 'text/html');
  return doc.body.textContent || "";
};

// Función para formatear fecha
const formatearFecha = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const generarPDFDictamen = (evaluacion) => {
  const doc = new jsPDF();
  let yPos = 20;

  // ============================================
  // ENCABEZADO
  // ============================================
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("DICTAMEN DE CALIFICACIÓN PCL", 105, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Fecha: ${formatearFecha(new Date())}`, 105, yPos, { align: "center" });
  yPos += 15;

  // ============================================
  // 1. INFORMACIÓN DEL DICTAMEN
  // ============================================
  if (evaluacion.informacionDictamen) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("1. INFORMACIÓN DEL DICTAMEN", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Campo", "Valor"]],
      body: [
        ["Fecha de Dictamen", formatearFecha(evaluacion.informacionDictamen.fechaDictamen) || "N/A"],
        ["Número de Dictamen", evaluacion.informacionDictamen.numeroDictamen || "N/A"],
        ["Tipo de Calificación", evaluacion.informacionDictamen.tipoCalificacion || "N/A"],
        ["Tipo Solicitante", evaluacion.informacionDictamen.tipoSolicitante || "N/A"],
        ["Nombre Solicitante", evaluacion.informacionDictamen.nombreSolicitante || "N/A"],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ============================================
  // 2. ENTIDAD CALIFICADORA
  // ============================================
  if (evaluacion.entidadCalificadora) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("2. ENTIDAD CALIFICADORA", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Campo", "Valor"]],
      body: [
        ["Nombre", evaluacion.entidadCalificadora.nombre || "N/A"],
        ["Identificación", evaluacion.entidadCalificadora.identificacion || "N/A"],
        ["Dirección", evaluacion.entidadCalificadora.direccion || "N/A"],
        ["Ciudad", evaluacion.entidadCalificadora.ciudad || "N/A"],
        ["Teléfono", evaluacion.entidadCalificadora.telefono || "N/A"],
        ["Correo", evaluacion.entidadCalificadora.correoElectronico || "N/A"],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ============================================
  // 3. DATOS DEL PACIENTE
  // ============================================
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("3. DATOS DEL PACIENTE", 14, yPos);
  yPos += 7;

  const datosPaciente = [
    ["Nombre Completo", evaluacion.paciente.nombreCompleto],
    ["Cédula", evaluacion.paciente.cedula],
    ["Edad", `${evaluacion.paciente.edad} años`],
    ["Género", evaluacion.paciente.genero || "N/A"],
    ["Ocupación", evaluacion.paciente.ocupacion],
    ["Dirección", evaluacion.paciente.direccion || "N/A"],
    ["Ciudad", evaluacion.paciente.ciudad || "N/A"],
    ["Estado Civil", evaluacion.paciente.estadoCivil || "N/A"],
    ["Escolaridad", evaluacion.paciente.escolaridad || "N/A"],
  ];

  if (evaluacion.paciente.eps || evaluacion.paciente.afp || evaluacion.paciente.arl) {
    datosPaciente.push(
      ["EPS", evaluacion.paciente.eps || "N/A"],
      ["AFP", evaluacion.paciente.afp || "N/A"],
      ["ARL", evaluacion.paciente.arl || "N/A"]
    );
  }

  autoTable(doc, {
    startY: yPos,
    head: [["Campo", "Valor"]],
    body: datosPaciente,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ============================================
  // 4. ANTECEDENTES LABORALES
  // ============================================
  if (evaluacion.antecedentesLaborales && Object.values(evaluacion.antecedentesLaborales).some(val => val)) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("4. ANTECEDENTES LABORALES", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Campo", "Valor"]],
      body: [
        ["Tipo de Vinculación", evaluacion.antecedentesLaborales.tipoVinculacion || "N/A"],
        ["Empresa", evaluacion.antecedentesLaborales.empresa || "N/A"],
        ["Cargo/Ocupación", evaluacion.antecedentesLaborales.ocupacion || "N/A"],
        ["Antigüedad", evaluacion.antecedentesLaborales.antiguedad || "N/A"],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 5;

    if (evaluacion.antecedentesLaborales.descripcionCargos) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Descripción de Cargos:", 14, yPos);
      yPos += 5;

      doc.setFont(undefined, "normal");
      const descripcionLines = doc.splitTextToSize(evaluacion.antecedentesLaborales.descripcionCargos, 180);
      doc.text(descripcionLines, 14, yPos);
      yPos += (descripcionLines.length * 5) + 10;
    }
  }

  // ============================================
  // 5. HISTORIAL CLÍNICO (Nueva página)
  // ============================================
  doc.addPage();
  yPos = 20;

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("5. HISTORIAL CLÍNICO", 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  const historialLines = doc.splitTextToSize(evaluacion.historialClinico, 180);
  doc.text(historialLines, 14, yPos);
  yPos += (historialLines.length * 5) + 10;

  // ============================================
  // 6. DIAGNÓSTICOS
  // ============================================
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("6. DIAGNÓSTICOS CIE-11", 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Diagnóstico Principal:", 14, yPos);
  yPos += 5;

  doc.setFont(undefined, "normal");
  const diagPrincipal = `${evaluacion.diagnosticoPrincipal.codigo} - ${limpiarHTML(evaluacion.diagnosticoPrincipal.nombre)}`;
  const diagPrincipalLines = doc.splitTextToSize(diagPrincipal, 180);
  doc.text(diagPrincipalLines, 14, yPos);
  yPos += (diagPrincipalLines.length * 5) + 8;

  if (evaluacion.diagnosticosSecundarios && evaluacion.diagnosticosSecundarios.length > 0) {
    doc.setFont(undefined, "bold");
    doc.text("Diagnósticos Secundarios:", 14, yPos);
    yPos += 5;

    doc.setFont(undefined, "normal");
    evaluacion.diagnosticosSecundarios.forEach((diag, index) => {
      const diagText = `${index + 1}. ${diag.codigo} - ${limpiarHTML(diag.nombre)}`;
      const diagLines = doc.splitTextToSize(diagText, 180);
      doc.text(diagLines, 14, yPos);
      yPos += (diagLines.length * 5) + 3;
    });
    yPos += 5;
  }

  // ============================================
  // 7. PORCENTAJES
  // ============================================
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("7. PORCENTAJES DE PÉRDIDA DE CAPACIDAD LABORAL", 14, yPos);
  yPos += 7;

  const porcentajes = [
    ["PCL Total", `${evaluacion.porcentajePCL}%`],
  ];

  if (evaluacion.deficiencia) porcentajes.push(["Deficiencia", `${evaluacion.deficiencia}%`]);
  if (evaluacion.discapacidad) porcentajes.push(["Discapacidad", `${evaluacion.discapacidad}%`]);
  if (evaluacion.minusvalia) porcentajes.push(["Minusvalía", `${evaluacion.minusvalia}%`]);

  autoTable(doc, {
    startY: yPos,
    head: [["Tipo", "Porcentaje"]],
    body: porcentajes,
    theme: "grid",
    headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, halign: "center" },
    margin: { left: 14, right: 14 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ============================================
  // 8. OBSERVACIONES Y RECOMENDACIONES
  // ============================================
  if (evaluacion.observaciones || evaluacion.recomendaciones) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("8. OBSERVACIONES Y RECOMENDACIONES", 14, yPos);
    yPos += 7;

    if (evaluacion.observaciones) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Observaciones:", 14, yPos);
      yPos += 5;

      doc.setFont(undefined, "normal");
      const obsLines = doc.splitTextToSize(evaluacion.observaciones, 180);
      doc.text(obsLines, 14, yPos);
      yPos += (obsLines.length * 5) + 8;
    }

    if (evaluacion.recomendaciones) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Recomendaciones:", 14, yPos);
      yPos += 5;

      doc.setFont(undefined, "normal");
      const recLines = doc.splitTextToSize(evaluacion.recomendaciones, 180);
      doc.text(recLines, 14, yPos);
      yPos += (recLines.length * 5) + 10;
    }
  }

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  doc.addPage();
  yPos = 20;

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("INFORMACIÓN DE LA EVALUACIÓN", 14, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Médico Evaluador: ${evaluacion.medicoEvaluador?.name || "N/A"}`, 14, yPos);
  yPos += 6;
  doc.text(`Fecha de Evaluación: ${formatearFecha(evaluacion.fechaEvaluacion)}`, 14, yPos);
  yPos += 6;
  doc.text(`Estado: ${evaluacion.estado}`, 14, yPos);
  yPos += 15;

  doc.setFont(undefined, "bold");
  doc.text("_____________________________", 14, yPos);
  yPos += 6;
  doc.text("Firma del Médico Evaluador", 14, yPos);

  // ============================================
  // GUARDAR PDF
  // ============================================
  const nombreArchivo = `Dictamen_PCL_${evaluacion.paciente.cedula}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
};