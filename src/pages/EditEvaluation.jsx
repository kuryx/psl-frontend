import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container, Paper, Typography, TextField, Button, Box, Tabs, Tab,
  Grid, MenuItem, Autocomplete, Chip, Alert, Divider, CircularProgress,
  IconButton, Switch, List, ListItem, ListItemText, ListItemSecondaryAction,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  obtenerEvaluacion,
  actualizarEvaluacion,
  buscarEnfermedadesCIE11,
  listarDocumentos,
  subirDocumento,
  eliminarDocumento,
  urlDocumento,
} from "../services/evaluationService";
import api from "../services/api";
import CalculadorPCL from "../components/CalculadorPCL";
import { buscarCIUO } from "../services/Ciuoservice";
import { getCurrentUser } from "../utils/auth";
import { calcularSugerenciasConsistencia } from "../utils/calculoPCL";

const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, "text/html");
  return doc.body.textContent || "";
};

const calcularEdad = (fechaNac, fechaRef) => {
  if (!fechaNac || !fechaRef) return "";
  const nac = new Date(fechaNac);
  const ref = new Date(fechaRef);
  let edad = ref.getFullYear() - nac.getFullYear();
  const m = ref.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? edad : 0;
};

const calcularAntiguedad = (fechaIng, fechaRef) => {
  if (!fechaIng || !fechaRef) return "";
  const ing = new Date(fechaIng);
  const ref = new Date(fechaRef);
  if (ref < ing) return "";
  let years = ref.getFullYear() - ing.getFullYear();
  let months = ref.getMonth() - ing.getMonth();
  if (ref.getDate() < ing.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years > 0) parts.push(`${years} año${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mes${months !== 1 ? "es" : ""}`);
  return parts.length > 0 ? parts.join(" y ") : "Menos de un mes";
};

export default function EditEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Documentos adjuntos
  const [documentos, setDocumentos] = useState([]);
  const [subiendoDoc, setSubiendoDoc] = useState(false);
  const fileRef = useRef();

  // Upload IA (extracción historia clínica)
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState("");
  const [pdfsPendientes, setPdfsPendientes] = useState([]);

  // Búsqueda de enfermedades CIE-11
  const [busquedaPrincipal, setBusquedaPrincipal] = useState("");
  const [resultadosPrincipal, setResultadosPrincipal] = useState([]);
  const [loadingPrincipal, setLoadingPrincipal] = useState(false);

  const [busquedaSecundarios, setBusquedaSecundarios] = useState("");
  const [resultadosSecundarios, setResultadosSecundarios] = useState([]);
  const [loadingSecundarios, setLoadingSecundarios] = useState(false);

  // Búsqueda de ocupaciones CIUO
  const [, setBusquedaCIUO] = useState("");
  const [resultadosCIUO, setResultadosCIUO] = useState([]);
  const [loadingCIUO, setLoadingCIUO] = useState(false);

  // Validación de consistencia CIF
  const [consistDialog, setConsistDialog] = useState({ open: false, sugerencias: [] });

  // Estado del formulario
  const [formData, setFormData] = useState({
    informacionDictamen: {
      fechaDictamen: "",
      numeroDictamen: "",
      motivoCalificacion: "",
      tipoCalificacion: "",
      instanciaActual: "",
      primeraOportunidad: "",
      primeraInstancia: "",
      tipoSolicitante: "",
      nombreSolicitante: "",
      identificacionSolicitante: "",
      telefonoSolicitante: "",
      ciudadSolicitante: "",
      direccionSolicitante: "",
      correoElectronicoSolicitante: "",
    },
    entidadCalificadora: {
      nombre: "",
      identificacion: "",
      direccion: "",
      ciudad: "",
      telefono: "",
      correoElectronico: "",
    },
    medicoCalificador: {
      nombre: "",
      cedula: "",
      correoElectronico: "",
      especialidad: "",
      registroProfesional: "",
    },
    paciente: {
      nombreCompleto: "",
      tipoIdentificacion: "CC",
      cedula: "",
      lugarExpedicion: "",
      fechaNacimiento: "",
      lugarNacimiento: "",
      edad: "",
      genero: "",
      estadoCivil: "",
      escolaridad: "",
      direccion: "",
      ciudad: "",
      telefonos: [""],
      celular: "",
      correoElectronico: "",
      ocupacion: "",
      etapasCicloVital: "",
      tipoUsuarioSGSS: "",
      eps: "",
      afp: "",
      arl: "",
      companiaSeguro: "",
    },
    antecedentesLaborales: {
      tipoVinculacion: "",
      trabajoEmpleo: "",
      ocupacion: "",
      codigoCIUO: "",
      actividadEconomica: "",
      empresa: "",
      identificacionEmpresa: "",
      direccionEmpresa: "",
      ciudadEmpresa: "",
      telefonoEmpresa: "",
      fechaIngreso: "",
      antiguedad: "",
      descripcionCargos: "",
    },
    historialClinico: "",
    resumenCaso: "",
    hallazgosExamenFisico: "",
    calificacionPrimeraOportunidad: "",
    procesoRehabilitacion: "No aplica",
    descripcionRehabilitacion: "",
    conceptosMedicos: [],
    valoracionesCalificador: [],
    analisisConclusiones: "",
    diagnosticoPrincipal: {
      codigo: "",
      nombre: "",
      fechaDiagnostico: "",
      diagnosticoEspecifico: "",
      origen: "",
    },
    diagnosticosSecundarios: [],
    porcentajePCL: "",
    deficiencia: "",
    discapacidad: "",
    minusvalia: "",
    detalleDeficiencias: [],
    valoracionRolLaboral: { restriccionesRolLaboral: 0, restriccionesAutosuficiencia: 0, restriccionesEdad: 0 },
    avdsDetalle: {},
    fechaEstructuracion: "",
    fechaDeclaratoria: "",
    origen: "Enfermedad común",
    riesgo: "Común",
    nivelPerdida: "Incapacidad permanente parcial",
    observaciones: "",
    recomendaciones: "",
    sustentacionFechaEstructuracion: "",
    muerte: false,
    fechaDefuncion: "",
    ayudaTercerosABC: false,
    ayudaTercerosDecisiones: false,
    requiereDispositivosApoyo: false,
    enfermedadAltoCosto: false,
    enfermedadDegenerativa: false,
    enfermedadProgresiva: false,
    calificacionIntegral: "No aplica",
    decisionJRCI: "",
    estado: "borrador",
  });

  useEffect(() => {
    cargarEvaluacion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarEvaluacion = async () => {
    try {
      const data = await obtenerEvaluacion(id);

      // Formatear fechas para inputs tipo date
      const formatearFecha = (fecha) => {
        if (!fecha) return "";
        return new Date(fecha).toISOString().split("T")[0];
      };

      setFormData({
        informacionDictamen: {
          fechaDictamen: formatearFecha(data.informacionDictamen?.fechaDictamen),
          numeroDictamen: data.informacionDictamen?.numeroDictamen || "",
          motivoCalificacion: data.informacionDictamen?.motivoCalificacion || "PCL (Dec 1507/2014)",
          tipoCalificacion: data.informacionDictamen?.tipoCalificacion || "Primera vez",
          instanciaActual: data.informacionDictamen?.instanciaActual || "Primera Instancia",
          primeraOportunidad: data.informacionDictamen?.primeraOportunidad || "",
          primeraInstancia: data.informacionDictamen?.primeraInstancia || "",
          tipoSolicitante: data.informacionDictamen?.tipoSolicitante || "",
          nombreSolicitante: data.informacionDictamen?.nombreSolicitante || "",
          identificacionSolicitante: data.informacionDictamen?.identificacionSolicitante || "",
          telefonoSolicitante: data.informacionDictamen?.telefonoSolicitante || "",
          ciudadSolicitante: data.informacionDictamen?.ciudadSolicitante || "",
          direccionSolicitante: data.informacionDictamen?.direccionSolicitante || "",
          correoElectronicoSolicitante:
            data.informacionDictamen?.correoElectronicoSolicitante || "",
        },
        entidadCalificadora: {
          nombre: data.entidadCalificadora?.nombre || "",
          identificacion: data.entidadCalificadora?.identificacion || "",
          direccion: data.entidadCalificadora?.direccion || "",
          ciudad: data.entidadCalificadora?.ciudad || "",
          telefono: data.entidadCalificadora?.telefono || "",
          correoElectronico: data.entidadCalificadora?.correoElectronico || "",
        },
        medicoCalificador: (() => {
          const u = getCurrentUser();
          return {
            nombre: data.medicoCalificador?.nombre || u?.name || "",
            cedula: data.medicoCalificador?.cedula || u?.cedula || "",
            correoElectronico: data.medicoCalificador?.correoElectronico || u?.email || "",
            especialidad: data.medicoCalificador?.especialidad || "",
            registroProfesional: data.medicoCalificador?.registroProfesional || "",
          };
        })(),
        paciente: {
          nombreCompleto: data.paciente?.nombreCompleto || "",
          tipoIdentificacion: data.paciente?.tipoIdentificacion || "CC",
          cedula: data.paciente?.cedula || "",
          lugarExpedicion: data.paciente?.lugarExpedicion || "",
          fechaNacimiento: formatearFecha(data.paciente?.fechaNacimiento),
          lugarNacimiento: data.paciente?.lugarNacimiento || "",
          edad: data.paciente?.edad || "",
          genero: data.paciente?.genero || "",
          estadoCivil: data.paciente?.estadoCivil || "",
          escolaridad: data.paciente?.escolaridad || "",
          direccion: data.paciente?.direccion || "",
          ciudad: data.paciente?.ciudad || "",
          telefonos: data.paciente?.telefonos?.length > 0 ? data.paciente.telefonos : [""],
          celular: data.paciente?.celular || "",
          correoElectronico: data.paciente?.correoElectronico || "",
          ocupacion: data.paciente?.ocupacion || "",
          etapasCicloVital:
            data.paciente?.etapasCicloVital || "Población en edad económicamente activa",
          tipoUsuarioSGSS: data.paciente?.tipoUsuarioSGSS || "",
          eps: data.paciente?.eps || "",
          afp: data.paciente?.afp || "",
          arl: data.paciente?.arl || "",
          companiaSeguro: data.paciente?.companiaSeguro || "",
        },
        antecedentesLaborales: {
          tipoVinculacion: data.antecedentesLaborales?.tipoVinculacion || "",
          trabajoEmpleo: data.antecedentesLaborales?.trabajoEmpleo || "",
          ocupacion: data.antecedentesLaborales?.ocupacion || "",
          codigoCIUO: data.antecedentesLaborales?.codigoCIUO || "",
          actividadEconomica: data.antecedentesLaborales?.actividadEconomica || "",
          empresa: data.antecedentesLaborales?.empresa || "",
          identificacionEmpresa: data.antecedentesLaborales?.identificacionEmpresa || "",
          direccionEmpresa: data.antecedentesLaborales?.direccionEmpresa || "",
          ciudadEmpresa: data.antecedentesLaborales?.ciudadEmpresa || "",
          telefonoEmpresa: data.antecedentesLaborales?.telefonoEmpresa || "",
          fechaIngreso: formatearFecha(data.antecedentesLaborales?.fechaIngreso),
          antiguedad: data.antecedentesLaborales?.antiguedad || "",
          descripcionCargos: data.antecedentesLaborales?.descripcionCargos || "",
        },
        historialClinico: data.historialClinico || "",
        resumenCaso: data.resumenCaso || "",
        hallazgosExamenFisico: data.hallazgosExamenFisico || "",
        calificacionPrimeraOportunidad: data.calificacionPrimeraOportunidad || "",
        procesoRehabilitacion: data.procesoRehabilitacion || "No aplica",
        descripcionRehabilitacion: data.descripcionRehabilitacion || "",
        conceptosMedicos: (data.conceptosMedicos || []).map((c) => ({
          ...c,
          fecha: c.fecha ? new Date(c.fecha).toISOString().split("T")[0] : "",
        })),
        valoracionesCalificador: (data.valoracionesCalificador || []).map((v) => ({
          ...v,
          fecha: v.fecha ? new Date(v.fecha).toISOString().split("T")[0] : "",
        })),
        analisisConclusiones: data.analisisConclusiones || "",
        diagnosticoPrincipal: {
          codigo: data.diagnosticoPrincipal?.codigo || "",
          nombre: data.diagnosticoPrincipal?.nombre || "",
          fechaDiagnostico: formatearFecha(data.diagnosticoPrincipal?.fechaDiagnostico),
          diagnosticoEspecifico: data.diagnosticoPrincipal?.diagnosticoEspecifico || "",
          origen: data.diagnosticoPrincipal?.origen || "",
        },
        diagnosticosSecundarios: data.diagnosticosSecundarios || [],
        porcentajePCL: data.porcentajePCL || "",
        deficiencia: data.deficiencia || "",
        discapacidad: data.discapacidad || "",
        minusvalia: data.minusvalia || "",
        detalleDeficiencias: data.detalleDeficiencias || [],
        valoracionRolLaboral: data.valoracionRolLaboral || { restriccionesRolLaboral: 0, restriccionesAutosuficiencia: 0, restriccionesEdad: 0 },
        avdsDetalle: data.avdsDetalle || {},
        fechaEstructuracion: formatearFecha(data.fechaEstructuracion),
        fechaDeclaratoria: formatearFecha(data.fechaDeclaratoria),
        origen: data.origen || "Enfermedad común",
        riesgo: data.riesgo || "Común",
        nivelPerdida: data.nivelPerdida || "Incapacidad permanente parcial",
        observaciones: data.observaciones || "",
        recomendaciones: data.recomendaciones || "",
        sustentacionFechaEstructuracion: data.sustentacionFechaEstructuracion || "",
        muerte: data.muerte || false,
        fechaDefuncion: formatearFecha(data.fechaDefuncion),
        ayudaTercerosABC: data.ayudaTercerosABC || false,
        ayudaTercerosDecisiones: data.ayudaTercerosDecisiones || false,
        requiereDispositivosApoyo: data.requiereDispositivosApoyo || false,
        enfermedadAltoCosto: data.enfermedadAltoCosto || false,
        enfermedadDegenerativa: data.enfermedadDegenerativa || false,
        enfermedadProgresiva: data.enfermedadProgresiva || false,
        calificacionIntegral: data.calificacionIntegral || "No aplica",
        decisionJRCI: data.decisionJRCI || "",
        estado: data.estado || "borrador",
      });

      setLoading(false);
    } catch (error) {
      setError("Error al cargar la evaluación");
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // ── Documentos adjuntos ─────────────────────────────────────────
  const cargarDocs = useCallback(async () => {
    try { setDocumentos(await listarDocumentos(id)); } catch {}
  }, [id]);

  useEffect(() => { cargarDocs(); }, [cargarDocs]);

  const handleSubirDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoDoc(true);
    try { await subirDocumento(id, file); await cargarDocs(); }
    catch { setError("Error al subir el documento"); }
    finally { setSubiendoDoc(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDescargarDoc = async (doc) => {
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(urlDocumento(id, doc._id), { headers: { Authorization: `Bearer ${token}` } });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = doc.nombre; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Error al descargar el documento"); }
  };

  const handleEliminarDoc = async (docId) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    try { await eliminarDocumento(id, docId); await cargarDocs(); }
    catch { setError("Error al eliminar el documento"); }
  };

  // ── Extracción IA desde PDF ─────────────────────────────────────
  const handlePDFSeleccion = (event) => {
    const archivos = Array.from(event.target.files || []);
    if (archivos.length === 0) return;
    const invalidos = archivos.filter((f) => f.type !== "application/pdf");
    if (invalidos.length > 0) { setError("Solo se permiten archivos PDF"); return; }
    const grandes = archivos.filter((f) => f.size > 10 * 1024 * 1024);
    if (grandes.length > 0) { setError("Cada archivo debe pesar máximo 10 MB"); return; }
    setError(""); setPdfSuccess("");
    setPdfsPendientes((prev) => {
      const existentes = prev.map((f) => f.name);
      const nuevos = archivos.filter((f) => !existentes.includes(f.name));
      return [...prev, ...nuevos].slice(0, 5);
    });
    event.target.value = "";
  };

  const eliminarPdfPendiente = (nombre) => {
    setPdfsPendientes((prev) => prev.filter((f) => f.name !== nombre));
  };

  const handleAnalizarPDFs = async () => {
    if (pdfsPendientes.length === 0) return;
    setUploadingPDF(true); setError(""); setPdfSuccess("");
    try {
      const pdfFormData = new FormData();
      pdfsPendientes.forEach((archivo) => pdfFormData.append("pdfs", archivo));
      const response = await api.post("/evaluations/extract-historia", pdfFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { data } = response.data;
      setFormData((prev) => ({
        ...prev,
        historialClinico: data.historialClinico || prev.historialClinico,
        resumenCaso: data.resumenCaso || prev.resumenCaso,
        calificacionPrimeraOportunidad: data.calificacionPrimeraOportunidad || prev.calificacionPrimeraOportunidad,
        procesoRehabilitacion: data.procesoRehabilitacion || prev.procesoRehabilitacion,
        observaciones: data.observaciones || prev.observaciones,
      }));
      setPdfSuccess(`Historia clínica extraída de ${pdfsPendientes.length} documento(s). ${data.conceptosMedicos?.length || 0} conceptos médicos encontrados.`);
      setPdfsPendientes([]);
    } catch (err) {
      setError(err.response?.data?.message || "Error al procesar los PDFs.");
    } finally { setUploadingPDF(false); }
  };

  const handleTelefonoChange = (index, value) => {
    setFormData(prev => {
      const newTelefonos = [...prev.paciente.telefonos];
      newTelefonos[index] = value;
      return { ...prev, paciente: { ...prev.paciente, telefonos: newTelefonos } };
    });
  };

  const agregarTelefono = () => {
    setFormData(prev => ({
      ...prev,
      paciente: { ...prev.paciente, telefonos: [...prev.paciente.telefonos, ""] },
    }));
  };

  const eliminarTelefono = (index) => {
    setFormData(prev => ({
      ...prev,
      paciente: { ...prev.paciente, telefonos: prev.paciente.telefonos.filter((_, i) => i !== index) },
    }));
  };

  const buscarDiagnosticoPrincipal = async (termino) => {
    if (termino.length < 3) return;
    setLoadingPrincipal(true);
    try {
      const resultados = await buscarEnfermedadesCIE11(termino);
      setResultadosPrincipal(resultados);
    } catch (error) {
      console.error("Error buscando diagnóstico:", error);
    } finally {
      setLoadingPrincipal(false);
    }
  };

  const buscarDiagnosticoSecundario = async (termino) => {
    if (termino.length < 3) return;
    setLoadingSecundarios(true);
    try {
      const resultados = await buscarEnfermedadesCIE11(termino);
      setResultadosSecundarios(resultados);
    } catch (error) {
      console.error("Error buscando diagnóstico:", error);
    } finally {
      setLoadingSecundarios(false);
    }
  };

  const agregarDiagnosticoSecundario = (diagnostico) => {
    const yaExiste = formData.diagnosticosSecundarios.some((d) => d.codigo === diagnostico.codigo);
    if (!yaExiste) {
      setFormData({
        ...formData,
        diagnosticosSecundarios: [
          ...formData.diagnosticosSecundarios,
          {
            codigo: diagnostico.codigo,
            nombre: diagnostico.nombre,
            fechaDiagnostico: "",
            diagnosticoEspecifico: "",
            origen: "",
          },
        ],
      });
    }
    setBusquedaSecundarios("");
  };

  const eliminarDiagnosticoSecundario = (codigo) => {
    setFormData({
      ...formData,
      diagnosticosSecundarios: formData.diagnosticosSecundarios.filter((d) => d.codigo !== codigo),
    });
  };

  // Búsqueda de ocupaciones CIUO
  const buscarOcupacionCIUO = async (termino) => {
    if (termino.length < 2) return;
    setLoadingCIUO(true);
    try {
      const resultados = await buscarCIUO(termino);
      setResultadosCIUO(resultados);
    } catch (error) {
      console.error("Error buscando ocupación CIUO:", error);
    } finally {
      setLoadingCIUO(false);
    }
  };

  const handleSubmit = async (omitirConsistencia = false) => {
    setError("");
    setSaving(true);

    const fail = (msg, tab) => {
      setError(msg);
      if (tab !== undefined) setTabActual(tab);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    };

    try {
      if (!formData.paciente.nombreCompleto?.trim())
        return fail("El nombre completo del paciente es obligatorio", 2);
      if (!formData.paciente.cedula?.trim())
        return fail("La cédula del paciente es obligatoria", 2);
      if (!formData.paciente.edad && formData.paciente.edad !== 0)
        return fail("La edad del paciente es obligatoria", 2);
      if (!formData.historialClinico?.trim())
        return fail("El historial clínico es obligatorio", 4);
      if (!formData.diagnosticoPrincipal?.codigo)
        return fail("Debe seleccionar un diagnóstico principal CIE-11", 5);
      if (formData.porcentajePCL === "" || formData.porcentajePCL === null || formData.porcentajePCL === undefined)
        return fail("Debe ingresar el porcentaje de PCL", 6);
      if (Number(formData.porcentajePCL) < 0 || Number(formData.porcentajePCL) > 100)
        return fail("El porcentaje de PCL debe estar entre 0 y 100", 6);
      if (Number(formData.porcentajePCL) > 0 && !formData.fechaEstructuracion)
        return fail("La fecha de estructuración es obligatoria cuando la PCL es mayor a 0", 6);

      // Advertencia de consistencia CIF (no bloqueante)
      if (!omitirConsistencia) {
        const sugerencias = calcularSugerenciasConsistencia(
          formData.detalleDeficiencias,
          formData.avdsDetalle
        );
        if (sugerencias.length > 0) {
          setConsistDialog({ open: true, sugerencias });
          setSaving(false);
          return;
        }
      }

      const datosLimpios = {
        ...formData,
        paciente: {
          ...formData.paciente,
          telefonos: formData.paciente.telefonos.filter((t) => t.trim() !== ""),
        },
      };

      await actualizarEvaluacion(id, datosLimpios);
      navigate(`/evaluations/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || "Error al actualizar evaluación");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando evaluación...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/evaluations/${id}`)}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Editar Evaluación PCL - {formData.informacionDictamen.numeroDictamen}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabActual}
          onChange={(e, newValue) => setTabActual(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
        >
          <Tab label="1. INFO DICTAMEN" />
          <Tab label="2. ENTIDAD" />
          <Tab label="3. PACIENTE" />
          <Tab label="4. LABORAL" />
          <Tab label="5. CLÍNICO" />
          <Tab label="6. DIAGNÓSTICOS" />
          <Tab label="7. PORCENTAJES" />
          <Tab label="8. OBSERVACIONES" />
          <Tab label="9. DOCUMENTOS" icon={<FolderOpenIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        {/* LAS 8 PESTAÑAS SON IDÉNTICAS A NewEvaluation.jsx */}
        {/* Copiando exactamente el mismo código de las pestañas... */}

        {/* TAB 1 */}
        {tabActual === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Información del Dictamen
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Dictamen"
                  type="date"
                  value={formData.informacionDictamen.fechaDictamen}
                  onChange={(e) => {
                    const fecha = e.target.value;
                    const edadCalc = calcularEdad(formData.paciente.fechaNacimiento, fecha);
                    const antigCalc = calcularAntiguedad(formData.antecedentesLaborales.fechaIngreso, fecha);
                    setFormData((prev) => ({
                      ...prev,
                      informacionDictamen: { ...prev.informacionDictamen, fechaDictamen: fecha },
                      paciente: { ...prev.paciente, edad: edadCalc !== "" ? String(edadCalc) : prev.paciente.edad },
                      antecedentesLaborales: { ...prev.antecedentesLaborales, antiguedad: antigCalc !== "" ? antigCalc : prev.antecedentesLaborales.antiguedad },
                    }));
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Dictamen"
                  value={formData.informacionDictamen.numeroDictamen}
                  disabled
                  helperText="Generado automáticamente"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Motivo de Calificación"
                  value={formData.informacionDictamen.motivoCalificacion}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "motivoCalificacion", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Calificación"
                  value={formData.informacionDictamen.tipoCalificacion}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "tipoCalificacion", e.target.value)
                  }
                >
                  <MenuItem value="Primera vez">Primera vez</MenuItem>
                  <MenuItem value="Revisión">Revisión</MenuItem>
                  <MenuItem value="Recalificación">Recalificación</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Instancia Actual"
                  value={formData.informacionDictamen.instanciaActual}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "instanciaActual", e.target.value)
                  }
                >
                  <MenuItem value="Primera Instancia">Primera Instancia</MenuItem>
                  <MenuItem value="Segunda Instancia">Segunda Instancia</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primera Oportunidad"
                  value={formData.informacionDictamen.primeraOportunidad}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "primeraOportunidad", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primera Instancia"
                  value={formData.informacionDictamen.primeraInstancia}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "primeraInstancia", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo Solicitante"
                  value={formData.informacionDictamen.tipoSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "tipoSolicitante", e.target.value)
                  }
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="EPS">EPS</MenuItem>
                  <MenuItem value="AFP">AFP</MenuItem>
                  <MenuItem value="ARL">ARL</MenuItem>
                  <MenuItem value="Compañía de Seguros">Compañía de Seguros</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre Solicitante"
                  value={formData.informacionDictamen.nombreSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "nombreSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Identificación Solicitante"
                  value={formData.informacionDictamen.identificacionSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "identificacionSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono Solicitante"
                  value={formData.informacionDictamen.telefonoSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "telefonoSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ciudad Solicitante"
                  value={formData.informacionDictamen.ciudadSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "ciudadSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dirección Solicitante"
                  value={formData.informacionDictamen.direccionSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "direccionSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico Solicitante"
                  type="email"
                  value={formData.informacionDictamen.correoElectronicoSolicitante}
                  onChange={(e) =>
                    handleChange(
                      "informacionDictamen",
                      "correoElectronicoSolicitante",
                      e.target.value
                    )
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 2: ENTIDAD CALIFICADORA */}
        {tabActual === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Información de la Entidad Calificadora
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Entidad"
                  value={formData.entidadCalificadora.nombre}
                  onChange={(e) => handleChange("entidadCalificadora", "nombre", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Identificación (NIT)"
                  value={formData.entidadCalificadora.identificacion}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "identificacion", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.entidadCalificadora.direccion}
                  onChange={(e) => handleChange("entidadCalificadora", "direccion", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.entidadCalificadora.ciudad}
                  onChange={(e) => handleChange("entidadCalificadora", "ciudad", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.entidadCalificadora.telefono}
                  onChange={(e) => handleChange("entidadCalificadora", "telefono", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.entidadCalificadora.correoElectronico}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "correoElectronico", e.target.value)
                  }
                />
              </Grid>
            </Grid>

            {/* ── MÉDICO CALIFICADOR ─────────────────────────────── */}
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 1 }}>
              Datos del Médico Calificador
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  value={formData.medicoCalificador.nombre}
                  onChange={(e) =>
                    handleChange("medicoCalificador", "nombre", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={formData.medicoCalificador.cedula}
                  onChange={(e) =>
                    handleChange("medicoCalificador", "cedula", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo electrónico"
                  type="email"
                  value={formData.medicoCalificador.correoElectronico}
                  onChange={(e) =>
                    handleChange("medicoCalificador", "correoElectronico", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Especialidad / Cargo"
                  value={formData.medicoCalificador.especialidad}
                  onChange={(e) =>
                    handleChange("medicoCalificador", "especialidad", e.target.value)
                  }
                  placeholder="Ej: Médico Laboral, Médico Ocupacional..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Registro / Tarjeta Profesional"
                  value={formData.medicoCalificador.registroProfesional}
                  onChange={(e) =>
                    handleChange("medicoCalificador", "registroProfesional", e.target.value)
                  }
                  placeholder="No. de tarjeta profesional"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 3: DATOS DEL PACIENTE */}
        {tabActual === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Datos del Paciente
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={formData.paciente.nombreCompleto}
                  onChange={(e) => handleChange("paciente", "nombreCompleto", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Tipo ID"
                  value={formData.paciente.tipoIdentificacion}
                  onChange={(e) => handleChange("paciente", "tipoIdentificacion", e.target.value)}
                >
                  <MenuItem value="CC">CC</MenuItem>
                  <MenuItem value="TI">TI</MenuItem>
                  <MenuItem value="CE">CE</MenuItem>
                  <MenuItem value="PA">PA</MenuItem>
                  <MenuItem value="RC">RC</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={formData.paciente.cedula}
                  onChange={(e) => handleChange("paciente", "cedula", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lugar de Expedición"
                  value={formData.paciente.lugarExpedicion}
                  onChange={(e) => handleChange("paciente", "lugarExpedicion", e.target.value)}
                  placeholder="Ej: MEDELLÍN - ANTIOQUIA"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formData.paciente.fechaNacimiento}
                  onChange={(e) => handleChange("paciente", "fechaNacimiento", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Edad"
                  type="number"
                  value={formData.paciente.edad}
                  onChange={(e) => handleChange("paciente", "edad", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lugar de Nacimiento"
                  value={formData.paciente.lugarNacimiento}
                  onChange={(e) => handleChange("paciente", "lugarNacimiento", e.target.value)}
                  placeholder="Ej: Medellín - Antioquia"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Género"
                  value={formData.paciente.genero}
                  onChange={(e) => handleChange("paciente", "genero", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Estado Civil"
                  value={formData.paciente.estadoCivil}
                  onChange={(e) => handleChange("paciente", "estadoCivil", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Soltero">Soltero</MenuItem>
                  <MenuItem value="Casado">Casado</MenuItem>
                  <MenuItem value="Unión libre">Unión libre</MenuItem>
                  <MenuItem value="Divorciado">Divorciado</MenuItem>
                  <MenuItem value="Viudo">Viudo</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Escolaridad"
                  value={formData.paciente.escolaridad}
                  onChange={(e) => handleChange("paciente", "escolaridad", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Ninguna">Ninguna</MenuItem>
                  <MenuItem value="Básica primaria">Básica primaria</MenuItem>
                  <MenuItem value="Básica secundaria">Básica secundaria</MenuItem>
                  <MenuItem value="Bachillerato">Bachillerato</MenuItem>
                  <MenuItem value="Técnico">Técnico</MenuItem>
                  <MenuItem value="Tecnólogo">Tecnólogo</MenuItem>
                  <MenuItem value="Pregrado">Pregrado</MenuItem>
                  <MenuItem value="Posgrado">Posgrado</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ocupación"
                  value={formData.paciente.ocupacion}
                  onChange={(e) => handleChange("paciente", "ocupacion", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.paciente.direccion}
                  onChange={(e) => handleChange("paciente", "direccion", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.paciente.ciudad}
                  onChange={(e) => handleChange("paciente", "ciudad", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Teléfonos
                </Typography>
                {formData.paciente.telefonos.map((telefono, index) => (
                  <Box key={index} display="flex" gap={1} mb={1}>
                    <TextField
                      fullWidth
                      label={`Teléfono ${index + 1}`}
                      value={telefono}
                      onChange={(e) => handleTelefonoChange(index, e.target.value)}
                    />
                    {formData.paciente.telefonos.length > 1 && (
                      <IconButton color="error" onClick={() => eliminarTelefono(index)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={agregarTelefono} size="small">
                  Agregar teléfono
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Celular / Móvil"
                  value={formData.paciente.celular}
                  onChange={(e) => handleChange("paciente", "celular", e.target.value)}
                  placeholder="Ej: 3001234567"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.paciente.correoElectronico}
                  onChange={(e) => handleChange("paciente", "correoElectronico", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Etapas del Ciclo Vital"
                  value={formData.paciente.etapasCicloVital}
                  onChange={(e) => handleChange("paciente", "etapasCicloVital", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Sistema de Seguridad Social
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo Usuario SGSS"
                  value={formData.paciente.tipoUsuarioSGSS}
                  onChange={(e) => handleChange("paciente", "tipoUsuarioSGSS", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="EPS"
                  value={formData.paciente.eps}
                  onChange={(e) => handleChange("paciente", "eps", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="AFP"
                  value={formData.paciente.afp}
                  onChange={(e) => handleChange("paciente", "afp", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ARL"
                  value={formData.paciente.arl}
                  onChange={(e) => handleChange("paciente", "arl", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Compañía de Seguros"
                  value={formData.paciente.companiaSeguro}
                  onChange={(e) => handleChange("paciente", "companiaSeguro", e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 4: ANTECEDENTES LABORALES */}
        {tabActual === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Antecedentes Laborales del Calificado
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Vinculación"
                  value={formData.antecedentesLaborales.tipoVinculacion}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "tipoVinculacion", e.target.value)
                  }
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Empleado">Empleado</MenuItem>
                  <MenuItem value="Independiente">Independiente</MenuItem>
                  <MenuItem value="Contratista">Contratista</MenuItem>
                  <MenuItem value="Pensionado">Pensionado</MenuItem>
                  <MenuItem value="Desempleado">Desempleado</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Trabajo/Empleo"
                  value={formData.antecedentesLaborales.trabajoEmpleo}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "trabajoEmpleo", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={resultadosCIUO}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : `${option.codigo} - ${option.ocupacion}`
                  }
                  loading={loadingCIUO}
                  value={
                    formData.antecedentesLaborales.codigoCIUO
                      ? {
                          codigo: formData.antecedentesLaborales.codigoCIUO,
                          ocupacion: formData.antecedentesLaborales.ocupacion,
                        }
                      : null
                  }
                  onInputChange={(e, value) => {
                    setBusquedaCIUO(value);
                    if (value.length >= 2) {
                      buscarOcupacionCIUO(value);
                    }
                  }}
                  onChange={(e, value) => {
                    if (value && typeof value === "object") {
                      handleChange("antecedentesLaborales", "codigoCIUO", value.codigo);
                      handleChange("antecedentesLaborales", "ocupacion", value.ocupacion);
                    } else if (!value) {
                      handleChange("antecedentesLaborales", "codigoCIUO", "");
                      handleChange("antecedentesLaborales", "ocupacion", "");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ocupación / Código CIUO"
                      placeholder="Escriba al menos 2 caracteres..."
                      helperText="Clasificación Internacional Uniforme de Ocupaciones"
                    />
                  )}
                  componentsProps={{
                    popper: {
                      style: { minWidth: 700 },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {option.codigo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.ocupacion}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Actividad Económica"
                  value={formData.antecedentesLaborales.actividadEconomica}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "actividadEconomica", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Empresa"
                  value={formData.antecedentesLaborales.empresa}
                  onChange={(e) => handleChange("antecedentesLaborales", "empresa", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Identificación Empresa (NIT)"
                  value={formData.antecedentesLaborales.identificacionEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "identificacionEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dirección Empresa"
                  value={formData.antecedentesLaborales.direccionEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "direccionEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ciudad Empresa"
                  value={formData.antecedentesLaborales.ciudadEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "ciudadEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono Empresa"
                  value={formData.antecedentesLaborales.telefonoEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "telefonoEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Ingreso"
                  type="date"
                  value={formData.antecedentesLaborales.fechaIngreso}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "fechaIngreso", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Antigüedad"
                  value={formData.antecedentesLaborales.antiguedad}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "antiguedad", e.target.value)
                  }
                  placeholder="Ej: 15 años"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción de los Cargos Desempeñados y Duración"
                  multiline
                  rows={4}
                  value={formData.antecedentesLaborales.descripcionCargos}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "descripcionCargos", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 5: HISTORIAL CLÍNICO */}
        {tabActual === 4 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight="bold">
                Información Clínica y Conceptos
              </Typography>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                {pdfsPendientes.map((f) => (
                  <Chip
                    key={f.name}
                    label={f.name}
                    size="small"
                    onDelete={() => eliminarPdfPendiente(f.name)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {pdfSuccess && <Typography variant="caption" color="success.main">{pdfSuccess}</Typography>}
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  disabled={uploadingPDF || pdfsPendientes.length >= 5}
                  color="secondary"
                >
                  Adjuntar PDF
                  <input type="file" hidden accept="application/pdf" multiple onChange={handlePDFSeleccion} />
                </Button>
                {pdfsPendientes.length > 0 && (
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    onClick={handleAnalizarPDFs}
                    disabled={uploadingPDF}
                    startIcon={uploadingPDF ? <CircularProgress size={14} /> : <AutoAwesomeIcon />}
                  >
                    {uploadingPDF ? "Analizando..." : `Analizar (${pdfsPendientes.length})`}
                  </Button>
                )}
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Resumen del Caso"
                  multiline
                  rows={4}
                  value={formData.resumenCaso}
                  onChange={(e) => handleChange(null, "resumenCaso", e.target.value)}
                  placeholder="Resumen general del caso clínico..."
                />
              </Grid>

              {/* Hallazgos en examen físico */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hallazgos en Examen Físico"
                  multiline
                  rows={4}
                  value={formData.hallazgosExamenFisico}
                  onChange={(e) => handleChange(null, "hallazgosExamenFisico", e.target.value)}
                  placeholder="Describa los hallazgos del examen físico del paciente..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Calificación en Primera Oportunidad"
                  multiline
                  rows={3}
                  value={formData.calificacionPrimeraOportunidad}
                  onChange={(e) =>
                    handleChange(null, "calificacionPrimeraOportunidad", e.target.value)
                  }
                  placeholder="Ej: Colpensiones calificó PCL de 41.91%..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Historial Clínico Completo"
                  multiline
                  rows={8}
                  value={formData.historialClinico}
                  onChange={(e) => handleChange(null, "historialClinico", e.target.value)}
                  required
                  placeholder="Descripción detallada del historial clínico del paciente..."
                />
              </Grid>

              {/* ── CONCEPTOS MÉDICOS ─────────────────────────────── */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  Conceptos Médicos de Especialistas
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {formData.conceptosMedicos.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sin conceptos médicos registrados.
                  </Typography>
                )}

                {formData.conceptosMedicos.map((concepto, idx) => (
                  <Box
                    key={idx}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        Concepto #{idx + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          const nuevo = formData.conceptosMedicos.filter((_, i) => i !== idx);
                          handleChange(null, "conceptosMedicos", nuevo);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth label="Fecha" type="date" size="small"
                          value={concepto.fecha || ""}
                          onChange={(e) => {
                            const nuevo = [...formData.conceptosMedicos];
                            nuevo[idx] = { ...nuevo[idx], fecha: e.target.value };
                            handleChange(null, "conceptosMedicos", nuevo);
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth label="Especialidad" size="small"
                          value={concepto.especialidad || ""}
                          onChange={(e) => {
                            const nuevo = [...formData.conceptosMedicos];
                            nuevo[idx] = { ...nuevo[idx], especialidad: e.target.value };
                            handleChange(null, "conceptosMedicos", nuevo);
                          }}
                          placeholder="Ej: Cardiología, Neurología..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth label="Resumen del Concepto" multiline rows={3} size="small"
                          value={concepto.resumen || ""}
                          onChange={(e) => {
                            const nuevo = [...formData.conceptosMedicos];
                            nuevo[idx] = { ...nuevo[idx], resumen: e.target.value };
                            handleChange(null, "conceptosMedicos", nuevo);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    handleChange(null, "conceptosMedicos", [
                      ...formData.conceptosMedicos,
                      { fecha: "", especialidad: "", resumen: "" },
                    ])
                  }
                  sx={{ mt: 1 }}
                >
                  Agregar concepto
                </Button>
              </Grid>

              {/* ── CONCEPTO DE REHABILITACIÓN ───────────────────── */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Concepto de Rehabilitación
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select fullWidth label="Estado"
                      value={formData.procesoRehabilitacion}
                      onChange={(e) => handleChange(null, "procesoRehabilitacion", e.target.value)}
                    >
                      <MenuItem value="Finalizado">Finalizado</MenuItem>
                      <MenuItem value="En curso">En curso</MenuItem>
                      <MenuItem value="No aplica">No aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={9}>
                    <TextField
                      fullWidth label="Descripción del proceso de rehabilitación" multiline rows={3}
                      value={formData.descripcionRehabilitacion}
                      onChange={(e) => handleChange(null, "descripcionRehabilitacion", e.target.value)}
                      placeholder="Descripción del proceso de rehabilitación realizado..."
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* ── VALORACIONES DEL CALIFICADOR ─────────────────── */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  Valoraciones del Calificador / Equipo Interdisciplinario
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {formData.valoracionesCalificador.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sin valoraciones registradas.
                  </Typography>
                )}

                {formData.valoracionesCalificador.map((val, idx) => (
                  <Box
                    key={idx}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        Valoración #{idx + 1}
                      </Typography>
                      <IconButton
                        size="small" color="error"
                        onClick={() => {
                          const nuevo = formData.valoracionesCalificador.filter((_, i) => i !== idx);
                          handleChange(null, "valoracionesCalificador", nuevo);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth label="Fecha" type="date" size="small"
                          value={val.fecha || ""}
                          onChange={(e) => {
                            const nuevo = [...formData.valoracionesCalificador];
                            nuevo[idx] = { ...nuevo[idx], fecha: e.target.value };
                            handleChange(null, "valoracionesCalificador", nuevo);
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          fullWidth label="Especialidad / Tipo de Valoración" size="small"
                          value={val.especialidad || ""}
                          onChange={(e) => {
                            const nuevo = [...formData.valoracionesCalificador];
                            nuevo[idx] = { ...nuevo[idx], especialidad: e.target.value };
                            handleChange(null, "valoracionesCalificador", nuevo);
                          }}
                          placeholder="Ej: Valoración Fisioterapeuta, Médico Ponente..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth label="Descripción de la Valoración" multiline rows={5} size="small"
                          value={val.valoracion || ""}
                          onChange={(e) => {
                            const nuevo = [...formData.valoracionesCalificador];
                            nuevo[idx] = { ...nuevo[idx], valoracion: e.target.value };
                            handleChange(null, "valoracionesCalificador", nuevo);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    handleChange(null, "valoracionesCalificador", [
                      ...formData.valoracionesCalificador,
                      { fecha: "", especialidad: "", valoracion: "" },
                    ])
                  }
                  sx={{ mt: 1 }}
                >
                  Agregar valoración
                </Button>
              </Grid>

              {/* ── ANÁLISIS Y CONCLUSIONES ───────────────────────── */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Análisis y Conclusiones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  fullWidth label="Análisis y Conclusiones" multiline rows={6}
                  value={formData.analisisConclusiones}
                  onChange={(e) => handleChange(null, "analisisConclusiones", e.target.value)}
                  placeholder="Análisis del caso y conclusiones del calificador..."
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 6: DIAGNÓSTICOS */}
        {tabActual === 5 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Diagnósticos CIE-11
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Diagnóstico Principal *
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={resultadosPrincipal}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.codigo} - ${limpiarHTML(option.nombre)}`
                  }
                  loading={loadingPrincipal}
                  inputValue={busquedaPrincipal}
                  onInputChange={(e, value, reason) => {
                    if (reason !== "reset") {
                      setBusquedaPrincipal(value);
                      if (value.length >= 3) buscarDiagnosticoPrincipal(value);
                    }
                  }}
                  onChange={(e, value) => {
                    if (value && typeof value === "object") {
                      handleChange(null, "diagnosticoPrincipal", {
                        codigo: value.codigo,
                        nombre: value.nombre,
                        fechaDiagnostico: formData.diagnosticoPrincipal.fechaDiagnostico || "",
                        diagnosticoEspecifico:
                          formData.diagnosticoPrincipal.diagnosticoEspecifico || "",
                      });
                      setBusquedaPrincipal("");
                      setResultadosPrincipal([]);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar diagnóstico CIE-11"
                      helperText={
                        formData.diagnosticoPrincipal.codigo
                          ? "Diagnóstico seleccionado abajo — busca para cambiar"
                          : "Busque por código o nombre"
                      }
                    />
                  )}
                  componentsProps={{ popper: { style: { minWidth: 700 } } }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {option.codigo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {limpiarHTML(option.nombre)}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                />
              </Grid>

              {formData.diagnosticoPrincipal.codigo && (
                <>
                  <Grid item xs={12}>
                    <Alert
                      severity="success"
                      icon={false}
                      action={
                        <Button
                          color="inherit"
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            handleChange(null, "diagnosticoPrincipal", {
                              codigo: "",
                              nombre: "",
                              fechaDiagnostico: "",
                              diagnosticoEspecifico: "",
                            });
                            setResultadosPrincipal([]);
                          }}
                        >
                          Cambiar
                        </Button>
                      }
                      sx={{ alignItems: "flex-start" }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {formData.diagnosticoPrincipal.codigo}
                      </Typography>
                      <Typography variant="body2">
                        {limpiarHTML(formData.diagnosticoPrincipal.nombre)}
                      </Typography>
                    </Alert>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de Diagnóstico"
                      type="date"
                      value={formData.diagnosticoPrincipal.fechaDiagnostico}
                      onChange={(e) =>
                        handleChange(null, "diagnosticoPrincipal", {
                          ...formData.diagnosticoPrincipal,
                          fechaDiagnostico: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Diagnóstico Específico"
                      value={formData.diagnosticoPrincipal.diagnosticoEspecifico}
                      onChange={(e) =>
                        handleChange(null, "diagnosticoPrincipal", {
                          ...formData.diagnosticoPrincipal,
                          diagnosticoEspecifico: e.target.value,
                        })
                      }
                      placeholder="Detalles adicionales del diagnóstico"
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      select
                      label="Origen"
                      value={formData.diagnosticoPrincipal.origen}
                      onChange={(e) =>
                        handleChange(null, "diagnosticoPrincipal", {
                          ...formData.diagnosticoPrincipal,
                          origen: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">Sin especificar</MenuItem>
                      <MenuItem value="Enfermedad común">Enfermedad común</MenuItem>
                      <MenuItem value="Enfermedad laboral">Enfermedad laboral</MenuItem>
                      <MenuItem value="Accidente de trabajo">Accidente de trabajo</MenuItem>
                      <MenuItem value="Accidente común">Accidente común</MenuItem>
                    </TextField>
                  </Grid>
                </>
              )}
            </Grid>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
              Diagnósticos Secundarios
            </Typography>

            <Autocomplete
              freeSolo
              options={resultadosSecundarios}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : `${option.codigo} - ${option.nombre}`
              }
              loading={loadingSecundarios}
              inputValue={busquedaSecundarios}
              onInputChange={(e, value) => {
                setBusquedaSecundarios(value);
                if (value.length >= 3) {
                  buscarDiagnosticoSecundario(value);
                }
              }}
              onChange={(e, value) => {
                if (value && typeof value === "object") {
                  agregarDiagnosticoSecundario(value);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar y agregar diagnósticos secundarios"
                  placeholder="Escriba al menos 3 caracteres..."
                />
              )}
              componentsProps={{
                popper: {
                  style: { minWidth: 700 },
                },
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.codigo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.nombre}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
            />

            <Box sx={{ mt: 2 }}>
              {formData.diagnosticosSecundarios.map((diagnostico, idx) => {
                const nombre = limpiarHTML(diagnostico.nombre);
                const updateSecundario = (campo, valor) => {
                  const updated = formData.diagnosticosSecundarios.map((d, i) =>
                    i === idx ? { ...d, [campo]: valor } : d
                  );
                  handleChange(null, "diagnosticosSecundarios", updated);
                };
                return (
                  <Box
                    key={diagnostico.codigo}
                    sx={{ mb: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                        <strong>{diagnostico.codigo}</strong> — {nombre.length > 80 ? nombre.substring(0, 80) + "..." : nombre}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => eliminarDiagnosticoSecundario(diagnostico.codigo)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        size="small"
                        label="Diagnóstico específico"
                        value={diagnostico.diagnosticoEspecifico || ""}
                        onChange={(e) => updateSecundario("diagnosticoEspecifico", e.target.value)}
                        placeholder="Detalles adicionales (opcional)"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Fecha de Diagnóstico"
                        type="date"
                        value={diagnostico.fechaDiagnostico ? diagnostico.fechaDiagnostico.substring(0, 10) : ""}
                        onChange={(e) => updateSecundario("fechaDiagnostico", e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 160 }}
                      />
                      <TextField
                        select
                        size="small"
                        label="Origen"
                        value={diagnostico.origen || ""}
                        onChange={(e) => updateSecundario("origen", e.target.value)}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">Sin especificar</MenuItem>
                        <MenuItem value="Enfermedad común">Enfermedad común</MenuItem>
                        <MenuItem value="Enfermedad laboral">Enfermedad laboral</MenuItem>
                        <MenuItem value="Accidente de trabajo">Accidente de trabajo</MenuItem>
                        <MenuItem value="Accidente común">Accidente común</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* TAB 7: PORCENTAJES PCL */}
        {tabActual === 6 && (
          <CalculadorPCL formData={formData} onChange={handleChange} />
        )}

        {/* TAB 8: OBSERVACIONES */}
        {tabActual === 7 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Observaciones y Conclusiones
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={4}
                  value={formData.observaciones}
                  onChange={(e) => handleChange(null, "observaciones", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recomendaciones"
                  multiline
                  rows={4}
                  value={formData.recomendaciones}
                  onChange={(e) => handleChange(null, "recomendaciones", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sustentación Fecha de Estructuración"
                  multiline
                  rows={3}
                  value={formData.sustentacionFechaEstructuracion}
                  onChange={(e) =>
                    handleChange(null, "sustentacionFechaEstructuracion", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Información Adicional
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {[
                { key: "ayudaTercerosABC", label: "Ayuda de terceros para actividades básicas cotidianas (ABC) y AVD" },
                { key: "ayudaTercerosDecisiones", label: "Ayuda de terceros para toma de decisiones" },
                { key: "requiereDispositivosApoyo", label: "Requiere dispositivos de apoyo" },
                { key: "enfermedadAltoCosto", label: "Enfermedad de alto costo / catastrófica" },
                { key: "enfermedadDegenerativa", label: "Enfermedad degenerativa" },
                { key: "enfermedadProgresiva", label: "Enfermedad progresiva" },
              ].map(({ key, label }) => (
                <Grid item xs={12} md={6} key={key}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 2,
                      py: 1.5,
                      height: "100%",
                    }}
                  >
                    <Typography variant="body2">{label}</Typography>
                    <Switch
                      checked={!!formData[key]}
                      onChange={(e) => handleChange(null, key, e.target.checked)}
                      color="primary"
                    />
                  </Box>
                </Grid>
              ))}

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Calificación Integral"
                  value={formData.calificacionIntegral}
                  onChange={(e) => handleChange(null, "calificacionIntegral", e.target.value)}
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="No aplica">No aplica</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Decisión frente a JRCI"
                  value={formData.decisionJRCI}
                  onChange={(e) => handleChange(null, "decisionJRCI", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Confirmar">Confirmar</MenuItem>
                  <MenuItem value="Modificar">Modificar</MenuItem>
                  <MenuItem value="Revocar">Revocar</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Estado del Dictamen"
                  value={formData.estado}
                  onChange={(e) => handleChange(null, "estado", e.target.value)}
                  helperText="Use el panel de workflow en la vista de detalle para avanzar instancias"
                >
                  <MenuItem value="borrador">Borrador</MenuItem>
                  <MenuItem value="primera_oportunidad">1a Oportunidad</MenuItem>
                  <MenuItem value="segunda_oportunidad">2a Oportunidad</MenuItem>
                  <MenuItem value="primera_instancia">Junta Regional</MenuItem>
                  <MenuItem value="segunda_instancia">Junta Nacional</MenuItem>
                  <MenuItem value="aprobado">Ejecutoriado</MenuItem>
                  <MenuItem value="recalificacion">Recalificación</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 9: DOCUMENTOS */}
        {tabActual === 8 && (
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Documentos Adjuntos
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Button
                variant="contained"
                component="label"
                startIcon={subiendoDoc ? <CircularProgress size={16} /> : <UploadFileIcon />}
                disabled={subiendoDoc}
              >
                {subiendoDoc ? "Subiendo..." : "Subir Documento"}
                <input ref={fileRef} type="file" hidden onChange={handleSubirDoc} />
              </Button>
              <Typography variant="caption" color="text.secondary">
                PDF, imágenes, Word, Excel — máx. 10 MB
              </Typography>
            </Box>

            {documentos.length === 0 ? (
              <Alert severity="info">No hay documentos adjuntos. Sube el primero.</Alert>
            ) : (
              <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                {documentos.map((doc, i) => (
                  <ListItem key={doc._id} divider={i < documentos.length - 1}>
                    <ListItemText
                      primary={doc.nombre}
                      secondary={`${(doc.tamaño / 1024).toFixed(1)} KB · ${new Date(doc.fechaSubida).toLocaleDateString("es-CO")}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Descargar">
                        <IconButton size="small" onClick={() => handleDescargarDoc(doc)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleEliminarDoc(doc._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Botones de navegación */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            onClick={() => setTabActual(Math.max(0, tabActual - 1))}
            disabled={tabActual === 0}
          >
            ← Anterior
          </Button>

          {tabActual < 7 ? (
            <Button variant="contained" onClick={() => setTabActual(Math.min(8, tabActual + 1))}>
              Siguiente →
            </Button>
          ) : tabActual === 8 ? (
            <Button variant="outlined" onClick={() => navigate(`/evaluations/${id}`)}>
              Volver al detalle
            </Button>
          ) : (
            <Box display="flex" gap={2}>
              <Button variant="outlined" onClick={() => navigate(`/evaluations/${id}`)}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialog de advertencia — motor de consistencia CIF */}
      <Dialog open={consistDialog.open} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Dominios CIF sin puntuar
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Las siguientes deficiencias registradas sugieren que estos dominios de actividades
            de vida diaria (AVD) deberían tener puntaje, pero aparecen en cero. Puede guardar
            de todas formas o volver al calculador para revisarlos.
          </Typography>
          {consistDialog.sugerencias.map(({ domId, nombre, causas, urgencia }) => (
            <Box key={domId} sx={{ mb: 1.5, p: 1.5, borderRadius: 1, bgcolor: urgencia === "alta" ? "error.50" : "warning.50", border: 1, borderColor: urgencia === "alta" ? "error.light" : "warning.light" }}>
              <Typography variant="body2" fontWeight="bold">
                {nombre}
                <Typography component="span" variant="caption" sx={{ ml: 1, px: 0.8, py: 0.2, borderRadius: 0.5, bgcolor: urgencia === "alta" ? "error.main" : "warning.main", color: "white" }}>
                  {urgencia === "alta" ? "ALTA" : "MEDIA"}
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Relacionado con: {(causas || []).join("; ") || "—"}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsistDialog({ open: false, sugerencias: [] })}>
            Volver y revisar
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<SaveIcon />}
            onClick={() => {
              setConsistDialog({ open: false, sugerencias: [] });
              handleSubmit(true);
            }}
          >
            Guardar de todas formas
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}