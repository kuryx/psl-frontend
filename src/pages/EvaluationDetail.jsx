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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { obtenerEvaluacion, eliminarEvaluacion } from "../services/evaluationService";

// Función para limpiar HTML
const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, 'text/html');
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
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !evaluacion) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
          <Alert severity="error">{error || "Evaluación no encontrada"}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/evaluations")}
            sx={{ mt: 2 }}
          >
            Volver al historial
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ mt: 4, p: 4, mb: 4 }}>
        {/* Header con botones */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/evaluations")}
          >
            Volver al historial
          </Button>

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
              onClick={() => alert("Generación de PDF próximamente")}
            >
              PDF
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
          <Typography variant="h4">Evaluación PCL</Typography>
          <Chip
            label={evaluacion.estado}
            color={getEstadoColor(evaluacion.estado)}
            size="medium"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* DATOS DEL PACIENTE */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Datos del Paciente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Nombre Completo
                </Typography>
                <Typography variant="body1">
                  {evaluacion.paciente.nombreCompleto}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Cédula
                </Typography>
                <Typography variant="body1">
                  {evaluacion.paciente.cedula}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Edad
                </Typography>
                <Typography variant="body1">
                  {evaluacion.paciente.edad} años
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Ocupación
                </Typography>
                <Typography variant="body1">
                  {evaluacion.paciente.ocupacion}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* HISTORIAL CLÍNICO */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historial Clínico
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {evaluacion.historialClinico}
            </Typography>
          </CardContent>
        </Card>

        {/* DIAGNÓSTICOS */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Diagnósticos (CIE-11)
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

        {/* PORCENTAJES */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Porcentajes de Pérdida
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
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
                    <Typography variant="h4" color="info.main">
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
                    <Typography variant="h4" color="warning.main">
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
                    <Typography variant="h4" color="error.main">
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

        {/* OBSERVACIONES Y RECOMENDACIONES */}
        {(evaluacion.observaciones || evaluacion.recomendaciones) && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Observaciones y Recomendaciones
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

        {/* INFORMACIÓN ADICIONAL */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información de la Evaluación
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Médico Evaluador
                </Typography>
                <Typography variant="body1">
                  {evaluacion.medicoEvaluador?.name}
                </Typography>
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
                <Typography variant="body1">
                  {formatearFecha(evaluacion.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Última Modificación
                </Typography>
                <Typography variant="body1">
                  {formatearFecha(evaluacion.updatedAt)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}