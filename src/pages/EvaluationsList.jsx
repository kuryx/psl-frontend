import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { listarEvaluaciones, eliminarEvaluacion } from "../services/evaluationService";
import { generarPDFDictamen } from "../utils/pdfGenerator";

// Función para limpiar HTML
const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, 'text/html');
  return doc.body.textContent || "";
};

export default function EvaluationsList() {
  const navigate = useNavigate();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    cargarEvaluaciones();
  }, [filtroEstado]);

  const cargarEvaluaciones = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;

      const data = await listarEvaluaciones(params);
      setEvaluaciones(data.evaluaciones);
    } catch (error) {
      setError("Error al cargar evaluaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta evaluación?")) {
      try {
        await eliminarEvaluacion(id);
        cargarEvaluaciones();
      } catch (error) {
        alert("Error al eliminar evaluación");
      }
    }
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

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Historial de Evaluaciones
          </Typography>

          <TextField
            select
            size="small"
            label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="borrador">Borradores</MenuItem>
            <MenuItem value="completada">Completadas</MenuItem>
            <MenuItem value="revisada">Revisadas</MenuItem>
          </TextField>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : evaluaciones.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No hay evaluaciones registradas
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate("/evaluations/new")}
            >
              Crear primera evaluación
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Cédula</TableCell>
                  <TableCell>Diagnóstico</TableCell>
                  <TableCell align="center">PCL %</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center" width="180">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evaluaciones.map((evaluacion) => (
                  <TableRow key={evaluacion._id} hover>
                    <TableCell>{evaluacion.paciente.nombreCompleto}</TableCell>
                    <TableCell>{evaluacion.paciente.cedula}</TableCell>
                    <TableCell>
                      {evaluacion.diagnosticoPrincipal.codigo} -{" "}
                      {limpiarHTML(evaluacion.diagnosticoPrincipal.nombre).substring(0, 40)}
                      {limpiarHTML(evaluacion.diagnosticoPrincipal.nombre).length > 40 && "..."}
                    </TableCell>
                    <TableCell align="center">
                      <strong>{evaluacion.porcentajePCL}%</strong>
                    </TableCell>
                    <TableCell>
                      {formatearFecha(evaluacion.fechaEvaluacion)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={evaluacion.estado}
                        color={getEstadoColor(evaluacion.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/evaluations/${evaluacion._id}`)}
                        title="Ver detalles"
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        color="info"
                        onClick={() => navigate(`/evaluations/${evaluacion._id}/edit`)}
                        title="Editar"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => generarPDFDictamen(evaluacion)}
                        title="Descargar PDF"
                        size="small"
                      >
                        <PictureAsPdfIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleEliminar(evaluacion._id)}
                        title="Eliminar"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}