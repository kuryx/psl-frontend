import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { obtenerEvaluacion, eliminarEvaluacion } from "../services/evaluationService";
import { generarPDFDictamen } from "../utils/pdfGenerator";

// Función para limpiar HTML
const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, "text/html");
  return doc.body.textContent || "";
};

export default function EvaluationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluacion, setEvaluacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEvaluacion();
  }, [id]);

  const cargarEvaluacion = async () => {
    setLoading(true);
    try {
      const data = await obtenerEvaluacion(id);
      setEvaluacion(data);
    } catch (error) {
      setError("Error al cargar la evaluación");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar esta evaluación?")) {
      try {
        await eliminarEvaluacion(id);
        navigate("/evaluations");
      } catch (error) {
        setError("Error al eliminar la evaluación");
        console.error(error);
      }
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "borrador":
        return "warning";
      case "completada":
        return "success";
      case "revisada":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !evaluacion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error">{error || "Evaluación no encontrada"}</Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header con botón volver y botones de acción */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/evaluations")}
              variant="outlined"
            >
              Volver
            </Button>
            <Typography variant="h5" fontWeight="bold">
              Detalle de Evaluación PCL
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/evaluations/${id}/edit`)}
              color="primary"
            >
              Editar
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => generarPDFDictamen(evaluacion)}
              color="secondary"
            >
              Descargar PDF
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" color="text.secondary">
            {evaluacion.paciente.nombreCompleto}
          </Typography>
          <Chip label={evaluacion.estado} color={getEstadoColor(evaluacion.estado)} size="medium" />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 1. INFORMACIÓN DEL DICTAMEN */}
        {evaluacion.informacionDictamen && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📋 Información del Dictamen
              </Typography>
              <Grid container spacing={2}>
                {evaluacion.informacionDictamen.fechaDictamen && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de Dictamen
                    </Typography>
                    <Typography variant="body1">
                      {formatearFecha(evaluacion.informacionDictamen.fechaDictamen)}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.informacionDictamen.numeroDictamen && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Número de Dictamen
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.informacionDictamen.numeroDictamen}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.informacionDictamen.tipoCalificacion && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Calificación
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.informacionDictamen.tipoCalificacion}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.informacionDictamen.tipoSolicitante && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo Solicitante
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.informacionDictamen.tipoSolicitante}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.informacionDictamen.nombreSolicitante && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre Solicitante
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.informacionDictamen.nombreSolicitante}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* 2. ENTIDAD CALIFICADORA */}
        {evaluacion.entidadCalificadora && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🏢 Entidad Calificadora
              </Typography>
              <Grid container spacing={2}>
                {evaluacion.entidadCalificadora.nombre && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre de la Entidad
                    </Typography>
                    <Typography variant="body1">{evaluacion.entidadCalificadora.nombre}</Typography>
                  </Grid>
                )}
                {evaluacion.entidadCalificadora.identificacion && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Identificación
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.entidadCalificadora.identificacion}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.entidadCalificadora.direccion && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Dirección
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.entidadCalificadora.direccion}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.entidadCalificadora.ciudad && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ciudad
                    </Typography>
                    <Typography variant="body1">{evaluacion.entidadCalificadora.ciudad}</Typography>
                  </Grid>
                )}
                {evaluacion.entidadCalificadora.telefono && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Teléfono
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.entidadCalificadora.telefono}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.entidadCalificadora.correoElectronico && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Correo Electrónico
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.entidadCalificadora.correoElectronico}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* 3. DATOS DEL PACIENTE (COMPLETOS) */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              👤 Datos del Paciente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Nombre Completo
                </Typography>
                <Typography variant="body1">{evaluacion.paciente.nombreCompleto}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Cédula
                </Typography>
                <Typography variant="body1">{evaluacion.paciente.cedula}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Edad
                </Typography>
                <Typography variant="body1">{evaluacion.paciente.edad} años</Typography>
              </Grid>
              {evaluacion.paciente.genero && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Género
                  </Typography>
                  <Typography variant="body1">{evaluacion.paciente.genero}</Typography>
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Ocupación
                </Typography>
                <Typography variant="body1">{evaluacion.paciente.ocupacion}</Typography>
              </Grid>

              {evaluacion.paciente.direccion && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1">{evaluacion.paciente.direccion}</Typography>
                </Grid>
              )}
              {evaluacion.paciente.ciudad && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ciudad
                  </Typography>
                  <Typography variant="body1">{evaluacion.paciente.ciudad}</Typography>
                </Grid>
              )}

              {evaluacion.paciente.estadoCivil && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estado Civil
                  </Typography>
                  <Typography variant="body1">{evaluacion.paciente.estadoCivil}</Typography>
                </Grid>
              )}
              {evaluacion.paciente.escolaridad && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Escolaridad
                  </Typography>
                  <Typography variant="body1">{evaluacion.paciente.escolaridad}</Typography>
                </Grid>
              )}

              {/* Sistema de Seguridad Social */}
              {(evaluacion.paciente.eps || evaluacion.paciente.afp || evaluacion.paciente.arl) && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: "bold" }}>
                      Sistema de Seguridad Social
                    </Typography>
                  </Grid>
                  {evaluacion.paciente.eps && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        EPS
                      </Typography>
                      <Typography variant="body1">{evaluacion.paciente.eps}</Typography>
                    </Grid>
                  )}
                  {evaluacion.paciente.afp && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        AFP
                      </Typography>
                      <Typography variant="body1">{evaluacion.paciente.afp}</Typography>
                    </Grid>
                  )}
                  {evaluacion.paciente.arl && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        ARL
                      </Typography>
                      <Typography variant="body1">{evaluacion.paciente.arl}</Typography>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
        {/* 4. ANTECEDENTES LABORALES */}
        {evaluacion.antecedentesLaborales && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                💼 Antecedentes Laborales
              </Typography>
              <Grid container spacing={2}>
                {evaluacion.antecedentesLaborales.tipoVinculacion && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo de Vinculación
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.antecedentesLaborales.tipoVinculacion}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.antecedentesLaborales.empresa && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Empresa
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.antecedentesLaborales.empresa}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.antecedentesLaborales.ocupacion && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Cargo/Ocupación
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.antecedentesLaborales.ocupacion}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.antecedentesLaborales.antiguedad && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Antigüedad
                    </Typography>
                    <Typography variant="body1">
                      {evaluacion.antecedentesLaborales.antiguedad}
                    </Typography>
                  </Grid>
                )}
                {evaluacion.antecedentesLaborales.descripcionCargos && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Descripción de Cargos
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {evaluacion.antecedentesLaborales.descripcionCargos}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* 5. HISTORIAL CLÍNICO */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Historial Clínico
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {evaluacion.historialClinico}
            </Typography>
          </CardContent>
        </Card>

        {/* 6. DIAGNÓSTICOS */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              🏥 Diagnósticos (CIE-11)
            </Typography>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Diagnóstico Principal
              </Typography>
              <Chip
                label={`${evaluacion.diagnosticoPrincipal.codigo} - ${limpiarHTML(evaluacion.diagnosticoPrincipal.nombre)}`}
                color="primary"
                sx={{ height: "auto", py: 1, "& .MuiChip-label": { whiteSpace: "normal" } }}
              />
            </Box>

            {evaluacion.diagnosticosSecundarios?.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Diagnósticos Secundarios
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {evaluacion.diagnosticosSecundarios.map((diag, index) => (
                    <Chip
                      key={index}
                      label={`${diag.codigo} - ${limpiarHTML(diag.nombre)}`}
                      size="small"
                      sx={{ height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 7. PORCENTAJES */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📊 Porcentajes de Pérdida
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {evaluacion.porcentajePCL}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PCL Total
                  </Typography>
                </Box>
              </Grid>
              {evaluacion.deficiencia && (
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {evaluacion.deficiencia}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Deficiencia
                    </Typography>
                  </Box>
                </Grid>
              )}
              {evaluacion.discapacidad && (
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {evaluacion.discapacidad}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Discapacidad
                    </Typography>
                  </Box>
                </Grid>
              )}
              {evaluacion.minusvalia && (
                <Grid item xs={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {evaluacion.minusvalia}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minusvalía
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* 8. OBSERVACIONES Y RECOMENDACIONES */}
        {(evaluacion.observaciones || evaluacion.recomendaciones) && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                💬 Observaciones y Recomendaciones
              </Typography>

              {evaluacion.observaciones && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Observaciones
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {evaluacion.observaciones}
                  </Typography>
                </Box>
              )}

              {evaluacion.recomendaciones && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recomendaciones
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {evaluacion.recomendaciones}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* 9. INFORMACIÓN DE LA EVALUACIÓN */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              ℹ️ Información de la Evaluación
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Médico Evaluador
                </Typography>
                <Typography variant="body1">{evaluacion.medicoEvaluador?.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Fecha de Evaluación
                </Typography>
                <Typography variant="body1">
                  {formatearFecha(evaluacion.fechaEvaluacion)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Fecha de Creación
                </Typography>
                <Typography variant="body1">{formatearFecha(evaluacion.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Última Modificación
                </Typography>
                <Typography variant="body1">{formatearFecha(evaluacion.updatedAt)}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}
