import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Button, Box, Grid, Chip, Divider,
  CircularProgress, Alert, Card, CardContent, Tab, Tabs, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip, LinearProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  obtenerEvaluacion, eliminarEvaluacion,
  listarDocumentos, subirDocumento, eliminarDocumento, urlDocumento,
  clonarEvaluacion,
} from "../services/evaluationService";
import { generarPDFDictamen } from "../utils/pdfGenerator";
import WorkflowPanel from "../components/WorkflowPanel";
import AuditTimeline from "../components/AuditTimeline";
import { canEdit, canDelete, hasAnyRole, ROLES } from "../utils/auth";

const limpiarHTML = (t) => {
  if (!t) return "";
  const d = new DOMParser().parseFromString(t, "text/html");
  return d.body.textContent || "";
};

const fmtFecha = (f) => f
  ? new Date(f).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  : "—";

const fmtTamano = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const ESTADO_COLOR = {
  borrador: "default", primera_oportunidad: "info", segunda_oportunidad: "info",
  primera_instancia: "warning", segunda_instancia: "error",
  aprobado: "success", completada: "success", revisada: "info", aprobada: "success",
};
const ESTADO_LABEL = {
  borrador: "Borrador", primera_oportunidad: "1a Oportunidad", segunda_oportunidad: "2a Oportunidad",
  primera_instancia: "Junta Regional", segunda_instancia: "Junta Nacional",
  aprobado: "Ejecutoriado", completada: "Completada", revisada: "Revisada", aprobada: "Aprobada",
};

const Campo = ({ label, value, xs = 12, md = 6 }) =>
  value ? (
    <Grid item xs={xs} md={md}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight="medium">{value}</Typography>
    </Grid>
  ) : null;

const Seccion = ({ titulo, children }) => (
  <Card variant="outlined" sx={{ mb: 0 }}>
    <CardContent>
      <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>{titulo}</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>{children}</Grid>
    </CardContent>
  </Card>
);

export default function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [evaluacion, setEvaluacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [documentos, setDocumentos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [docError, setDocError] = useState("");
  const [clonando, setClonando] = useState(false);

  useEffect(() => { cargar(); }, [id]);
  useEffect(() => { if (evaluacion) cargarDocs(); }, [evaluacion?._id]);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await obtenerEvaluacion(id);
      setEvaluacion(data);
    } catch { setError("Error al cargar la evaluación"); }
    finally { setLoading(false); }
  };

  const cargarDocs = async () => {
    try { setDocumentos(await listarDocumentos(id)); } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta evaluación permanentemente?")) return;
    try { await eliminarEvaluacion(id); navigate("/evaluations"); }
    catch { setError("Error al eliminar"); }
  };

  const handleClonar = async () => {
    if (!window.confirm(`¿Crear una recalificación basada en este dictamen?\n\nSe abrirá una copia en borrador con los datos del paciente y diagnósticos. Podrás modificarla antes de guardar.`)) return;
    setClonando(true);
    try {
      const data = await clonarEvaluacion(id);
      navigate(`/evaluations/${data.evaluacion._id}/edit`);
    } catch {
      setError("Error al crear la recalificación");
    } finally {
      setClonando(false);
    }
  };

  const handleSubirDoc = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true); setDocError("");
    try {
      await subirDocumento(id, archivo);
      await cargarDocs();
    } catch (err) {
      setDocError(err?.response?.data?.message || "Error al subir el archivo");
    } finally { setSubiendo(false); e.target.value = ""; }
  };

  const handleEliminarDoc = async (docId) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    try { await eliminarDocumento(id, docId); await cargarDocs(); } catch {}
  };

  const handleDescargarDoc = (docId, nombre) => {
    const token = localStorage.getItem("token");
    fetch(urlDocumento(id, docId), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = nombre; a.click();
        URL.revokeObjectURL(url);
      });
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
    </Container>
  );

  if (error || !evaluacion) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error">{error || "Evaluación no encontrada"}</Alert>
    </Container>
  );

  const ev = evaluacion;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── Encabezado ── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/evaluations")} variant="outlined" size="small">
            Volver
          </Button>
          <Box>
            <Typography variant="h5" fontWeight="bold">{ev.paciente.nombreCompleto}</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Typography variant="body2" color="text.secondary">
                {ev.informacionDictamen?.numeroDictamen || "Sin N° dictamen"} · CC {ev.paciente.cedula}
              </Typography>
              <Chip
                label={ESTADO_LABEL[ev.estado] || ev.estado}
                color={ESTADO_COLOR[ev.estado] || "default"}
                size="small"
              />
            </Box>
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {canEdit() && (
            <Button variant="contained" size="small" startIcon={<EditIcon />}
              onClick={() => navigate(`/evaluations/${id}/edit`)}>Editar</Button>
          )}
          <Button variant="outlined" size="small"
            startIcon={pdfLoading ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
            disabled={pdfLoading} color="secondary"
            onClick={async () => { setPdfLoading(true); try { await generarPDFDictamen(ev); } finally { setPdfLoading(false); } }}>
            {pdfLoading ? "Generando..." : "PDF"}
          </Button>
          {canEdit() && (
            <Button variant="outlined" size="small" color="success"
              startIcon={clonando ? <CircularProgress size={14} /> : <ContentCopyIcon />}
              disabled={clonando} onClick={handleClonar}>
              {clonando ? "Creando..." : "Recalificación"}
            </Button>
          )}
          <Button variant="outlined" size="small" color="info"
            onClick={() => navigate(`/evaluations?busqueda=${ev.paciente.cedula}`)}>
            Ver historial paciente
          </Button>
          {canDelete() && (
            <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
              Eliminar
            </Button>
          )}
        </Box>
      </Box>

      {/* ── KPI PCL ── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        <Box textAlign="center">
          <Typography variant="h2" fontWeight="bold" color="primary.main" lineHeight={1}>
            {ev.porcentajePCL}%
          </Typography>
          <Typography variant="caption" color="text.secondary">PCL Total</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        {ev.deficiencia != null && (
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold" color="info.main">{ev.deficiencia}%</Typography>
            <Typography variant="caption" color="text.secondary">Deficiencia (TI)</Typography>
          </Box>
        )}
        {(ev.discapacidad != null || ev.minusvalia != null) && (
          <Box textAlign="center">
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {ev.discapacidad ?? ev.minusvalia ?? 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary">Discapacidad (TII)</Typography>
          </Box>
        )}
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="body2"><strong>Origen:</strong> {ev.origen || "—"}</Typography>
          <Typography variant="body2"><strong>Riesgo:</strong> {ev.riesgo || "—"}</Typography>
          <Typography variant="body2"><strong>Nivel:</strong> {ev.nivelPerdida || "—"}</Typography>
          {ev.fechaEstructuracion && (
            <Typography variant="body2"><strong>F. Estructuración:</strong> {fmtFecha(ev.fechaEstructuracion)}</Typography>
          )}
        </Box>
        <Box>
          <Typography variant="body2"><strong>Diagnóstico:</strong></Typography>
          <Typography variant="body2" color="text.secondary">
            {ev.diagnosticoPrincipal.codigo} — {limpiarHTML(ev.diagnosticoPrincipal.nombre).substring(0, 60)}
          </Typography>
          {ev.diagnosticosSecundarios?.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              +{ev.diagnosticosSecundarios.length} diagnóstico(s) secundario(s)
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ── Workflow ── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <WorkflowPanel evaluacion={ev} onActualizado={cargar} />
      </Paper>

      {/* ── Tabs ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Información general" />
          <Tab label="Clínica y diagnósticos" />
          <Tab label={`Documentos (${documentos.length})`} />
          {hasAnyRole([ROLES.ADMIN, ROLES.COORDINADOR, ROLES.MEDICO]) && <Tab label="Auditoría" />}
        </Tabs>

        <Box p={3}>

          {/* Tab 0 — Información general */}
          {tab === 0 && (
            <Box display="flex" flexDirection="column" gap={2}>
              {ev.informacionDictamen && (
                <Seccion titulo="Información del Dictamen">
                  <Campo label="N° Dictamen" value={ev.informacionDictamen.numeroDictamen} />
                  <Campo label="Fecha" value={fmtFecha(ev.informacionDictamen.fechaDictamen)} />
                  <Campo label="Tipo de calificación" value={ev.informacionDictamen.tipoCalificacion} />
                  <Campo label="Motivo" value={ev.informacionDictamen.motivoCalificacion} />
                  <Campo label="Instancia" value={ev.informacionDictamen.instanciaActual} />
                  <Campo label="Solicitante" value={ev.informacionDictamen.nombreSolicitante} />
                  <Campo label="Tipo solicitante" value={ev.informacionDictamen.tipoSolicitante} />
                  <Campo label="Teléfono Fijo" value={ev.informacionDictamen.telefonoSolicitante} md={4} />
                  <Campo label="Celular / Móvil" value={ev.informacionDictamen.celularSolicitante} md={4} />
                  <Campo label="Ciudad" value={ev.informacionDictamen.ciudadSolicitante} md={4} />
                </Seccion>
              )}
              <Seccion titulo="Datos del Paciente">
                <Campo label="Nombre" value={ev.paciente.nombreCompleto} />
                <Campo label="Cédula" value={`${ev.paciente.tipoIdentificacion || "CC"} ${ev.paciente.cedula}`} />
                <Campo label="Fecha de nacimiento" value={fmtFecha(ev.paciente.fechaNacimiento)} md={4} />
                <Campo label="Edad" value={ev.paciente.edad ? `${ev.paciente.edad} años` : null} md={4} />
                <Campo label="Género" value={ev.paciente.genero} md={4} />
                <Campo label="Estado civil" value={ev.paciente.estadoCivil} md={4} />
                <Campo label="Escolaridad" value={ev.paciente.escolaridad} md={4} />
                <Campo label="Ocupación" value={ev.paciente.ocupacion} md={4} />
                <Campo label="Ciudad" value={ev.paciente.ciudad} />
                <Campo label="Dirección" value={ev.paciente.direccion} />
                <Campo label="Celular / Móvil" value={ev.paciente.celular} md={4} />
                <Campo label="EPS" value={ev.paciente.eps} md={4} />
                <Campo label="AFP" value={ev.paciente.afp} md={4} />
                <Campo label="ARL" value={ev.paciente.arl} md={4} />
              </Seccion>
              {ev.antecedentesLaborales && (
                <Seccion titulo="Antecedentes Laborales">
                  <Campo label="Tipo de vinculación" value={ev.antecedentesLaborales.tipoVinculacion} />
                  <Campo label="Empresa" value={ev.antecedentesLaborales.empresa} />
                  <Campo label="Cargo / Ocupación" value={ev.antecedentesLaborales.ocupacion} />
                  <Campo label="Antigüedad" value={ev.antecedentesLaborales.antiguedad} />
                  <Campo label="Actividad económica" value={ev.antecedentesLaborales.actividadEconomica} />
                  {ev.antecedentesLaborales.descripcionCargos && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Descripción del cargo</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {ev.antecedentesLaborales.descripcionCargos}
                      </Typography>
                    </Grid>
                  )}
                </Seccion>
              )}
              <Seccion titulo="Registro">
                <Campo label="Médico evaluador" value={ev.medicoEvaluador?.name} />
                <Campo label="Fecha de evaluación" value={fmtFecha(ev.fechaEvaluacion)} />
                <Campo label="Creado" value={fmtFecha(ev.createdAt)} />
                <Campo label="Última modificación" value={fmtFecha(ev.updatedAt)} />
              </Seccion>
            </Box>
          )}

          {/* Tab 1 — Clínica y diagnósticos */}
          {tab === 1 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Seccion titulo="Diagnósticos CIE-11">
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Diagnóstico principal</Typography>
                  <Chip
                    label={`${ev.diagnosticoPrincipal.codigo} — ${limpiarHTML(ev.diagnosticoPrincipal.nombre)}`}
                    color="primary" sx={{ mt: 0.5, height: "auto", py: 1, "& .MuiChip-label": { whiteSpace: "normal" } }}
                  />
                </Grid>
                {ev.diagnosticosSecundarios?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Diagnósticos secundarios</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                      {ev.diagnosticosSecundarios.map((d, i) => (
                        <Chip key={i} size="small"
                          label={`${d.codigo} — ${limpiarHTML(d.nombre)}`}
                          sx={{ height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Seccion>

              {ev.hallazgosExamenFisico && (
                <Seccion titulo="Hallazgos en Examen Físico">
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{ev.hallazgosExamenFisico}</Typography>
                  </Grid>
                </Seccion>
              )}

              {ev.historialClinico && (
                <Seccion titulo="Historial Clínico">
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{ev.historialClinico}</Typography>
                  </Grid>
                </Seccion>
              )}

              {ev.analisisConclusiones && (
                <Seccion titulo="Análisis y Conclusiones">
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{ev.analisisConclusiones}</Typography>
                  </Grid>
                </Seccion>
              )}

              <Seccion titulo="Condiciones especiales">
                <Campo label="Muerte" value={ev.muerte ? `Sí — ${fmtFecha(ev.fechaDefuncion)}` : "No"} md={4} />
                <Campo label="Ayuda de terceros (ABC)" value={ev.ayudaTercerosABC ? "Sí" : "No"} md={4} />
                <Campo label="Ayuda para decisiones" value={ev.ayudaTercerosDecisiones ? "Sí" : "No"} md={4} />
                <Campo label="Dispositivos de apoyo" value={ev.requiereDispositivosApoyo ? "Sí" : "No"} md={4} />
                <Campo label="Enfermedad alto costo" value={ev.enfermedadAltoCosto ? "Sí" : "No"} md={4} />
                <Campo label="Degenerativa / Progresiva"
                  value={ev.enfermedadDegenerativa || ev.enfermedadProgresiva ? "Sí" : "No"} md={4} />
                <Campo label="Calificación integral" value={ev.calificacionIntegral} md={6} />
                <Campo label="Decisión JRCI" value={ev.decisionJRCI} md={6} />
              </Seccion>

              {(ev.observaciones || ev.recomendaciones) && (
                <Seccion titulo="Observaciones y Recomendaciones">
                  {ev.observaciones && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{ev.observaciones}</Typography>
                    </Grid>
                  )}
                  {ev.recomendaciones && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Recomendaciones</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{ev.recomendaciones}</Typography>
                    </Grid>
                  )}
                </Seccion>
              )}
            </Box>
          )}

          {/* Tab 2 — Documentos */}
          {tab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">Documentos adjuntos</Typography>
                <Box>
                  <input ref={fileRef} type="file" hidden
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleSubirDoc} />
                  <Button variant="contained" size="small" startIcon={<UploadFileIcon />}
                    onClick={() => fileRef.current?.click()} disabled={subiendo}>
                    {subiendo ? "Subiendo..." : "Subir documento"}
                  </Button>
                </Box>
              </Box>
              {subiendo && <LinearProgress sx={{ mb: 2 }} />}
              {docError && <Alert severity="error" sx={{ mb: 2 }}>{docError}</Alert>}
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Formatos admitidos: PDF, JPG, PNG, DOC, DOCX · Máximo 15 MB por archivo
              </Typography>
              {documentos.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <InsertDriveFileIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                  <Typography color="text.secondary" mt={1}>No hay documentos adjuntos</Typography>
                </Box>
              ) : (
                <List dense>
                  {documentos.map((doc) => (
                    <ListItem key={doc._id} divider
                      sx={{ bgcolor: "background.paper", borderRadius: 1, mb: 0.5 }}>
                      <InsertDriveFileIcon sx={{ mr: 1.5, color: "primary.main" }} />
                      <ListItemText
                        primary={doc.nombre}
                        secondary={`${fmtTamano(doc.tamano)} · Subido por ${doc.subidoPor} · ${fmtFecha(doc.fechaSubida)}`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Descargar">
                          <IconButton size="small" onClick={() => handleDescargarDoc(doc._id, doc.nombre)}>
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

          {/* Tab 3 — Auditoría */}
          {tab === 3 && hasAnyRole([ROLES.ADMIN, ROLES.COORDINADOR, ROLES.MEDICO]) && (
            <AuditTimeline evaluacionId={ev._id} />
          )}
        </Box>
      </Paper>
    </Container>
  );
}
