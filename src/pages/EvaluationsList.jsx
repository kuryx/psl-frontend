import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container, Paper, Typography, Button, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  TextField, MenuItem, CircularProgress, Alert, InputAdornment, Pagination,
  Collapse, Slider,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import { listarEvaluaciones, eliminarEvaluacion, exportarEvaluaciones } from "../services/evaluationService";
import { generarPDFDictamen } from "../utils/pdfGenerator";
import { canCreate, canEdit, canDelete } from "../utils/auth";

const LIMIT = 15;

const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, "text/html");
  return doc.body.textContent || "";
};

const PLAZOS = {
  primera_oportunidad: 5,
  segunda_oportunidad: 30,
  primera_instancia: 45,
  segunda_instancia: 45,
};

const calcularSemaforo = (evaluacion) => {
  const plazo = PLAZOS[evaluacion.estado];
  if (!plazo) return null;
  const historial = evaluacion.historialEstados || [];
  const entrada = [...historial]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .find((h) => h.estado === evaluacion.estado);
  if (!entrada) return null;
  const limite = new Date(new Date(entrada.fecha).getTime() + plazo * 86400000);
  const dias = Math.ceil((limite - new Date()) / 86400000);
  if (dias > 10) return { color: "#2e7d32", label: `${dias}d` };
  if (dias >= 0) return { color: "#ed6c02", label: `${dias}d` };
  return { color: "#d32f2f", label: `${Math.abs(dias)}d venc.` };
};

const ESTADO_COLOR = {
  borrador: "default", primera_oportunidad: "info", segunda_oportunidad: "info",
  primera_instancia: "warning", segunda_instancia: "error", aprobado: "success",
  completada: "success", revisada: "info", aprobada: "success",
};

const ESTADO_LABEL = {
  borrador: "Borrador", primera_oportunidad: "1a Oportunidad",
  segunda_oportunidad: "2a Oportunidad", primera_instancia: "Junta Regional",
  segunda_instancia: "Junta Nacional", aprobado: "Ejecutoriado",
  completada: "Completada", revisada: "Revisada", aprobada: "Aprobada",
};

const fmtFecha = (f) =>
  new Date(f).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

export default function EvaluationsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const busquedaInicial = new URLSearchParams(location.search).get("busqueda") || "";
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [busquedaDebounced, setBusquedaDebounced] = useState(busquedaInicial);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pclRango, setPclRango] = useState([0, 100]);

  // Debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounced(busqueda);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Reset page cuando cambian filtros
  useEffect(() => { setPage(1); }, [filtroEstado, fechaDesde, fechaHasta, pclRango]);

  useEffect(() => {
    cargar();
  }, [filtroEstado, busquedaDebounced, page, fechaDesde, fechaHasta, pclRango]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: LIMIT };
      if (filtroEstado) params.estado = filtroEstado;
      if (busquedaDebounced.trim()) params.busqueda = busquedaDebounced.trim();
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;
      if (pclRango[0] > 0) params.pclMin = pclRango[0];
      if (pclRango[1] < 100) params.pclMax = pclRango[1];
      const data = await listarEvaluaciones(params);
      setEvaluaciones(data.evaluaciones);
      setTotal(data.total);
      setTotalPages(data.totalPages || Math.ceil(data.total / LIMIT));
    } catch {
      setError("Error al cargar evaluaciones");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, busquedaDebounced, page, fechaDesde, fechaHasta, pclRango]);

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta evaluación?")) return;
    try {
      await eliminarEvaluacion(id);
      cargar();
    } catch {
      alert("Error al eliminar evaluación");
    }
  };

  const handleExportarCSV = async () => {
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (busquedaDebounced.trim()) params.busqueda = busquedaDebounced.trim();
      const evs = await exportarEvaluaciones(params);

      const encabezado = ["N° Dictamen","Paciente","Cédula","Diagnóstico","PCL %","Origen","Estado","Fecha evaluación","Fecha estructuración"];
      const filas = evs.map((ev) => [
        ev.informacionDictamen?.numeroDictamen || "",
        ev.paciente?.nombreCompleto || "",
        ev.paciente?.cedula || "",
        `${ev.diagnosticoPrincipal?.codigo || ""} - ${limpiarHTML(ev.diagnosticoPrincipal?.nombre || "")}`,
        ev.porcentajePCL ?? "",
        ev.origen || "",
        ev.estado || "",
        ev.fechaEvaluacion ? new Date(ev.fechaEvaluacion).toLocaleDateString("es-ES") : "",
        ev.fechaEstructuracion ? new Date(ev.fechaEstructuracion).toLocaleDateString("es-ES") : "",
      ]);

      const csv = [encabezado, ...filas]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evaluaciones_pcl_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>

        {/* Encabezado */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold">Historial de Evaluaciones</Typography>
            {!loading && (
              <Typography variant="caption" color="text.secondary">
                {total} {total === 1 ? "evaluación encontrada" : "evaluaciones encontradas"}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined" size="small" startIcon={<DownloadIcon />}
              onClick={handleExportarCSV} title="Exportar resultados actuales a CSV"
            >
              Exportar CSV
            </Button>
            {canCreate() && (
              <Button variant="contained" onClick={() => navigate("/evaluations/new")}>
                + Nueva Evaluación
              </Button>
            )}
          </Box>
        </Box>

        {/* Filtros principales */}
        <Box display="flex" gap={2} mb={1} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar por nombre, cédula o N° dictamen..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ flex: 1, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: busqueda ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setBusqueda("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            select size="small" label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">Todos los estados</MenuItem>
            <MenuItem value="borrador">Borrador</MenuItem>
            <MenuItem value="primera_oportunidad">1a Oportunidad</MenuItem>
            <MenuItem value="segunda_oportunidad">2a Oportunidad</MenuItem>
            <MenuItem value="primera_instancia">Junta Regional</MenuItem>
            <MenuItem value="segunda_instancia">Junta Nacional</MenuItem>
            <MenuItem value="aprobado">Ejecutoriado</MenuItem>
          </TextField>
          <Button
            size="small" variant={filtrosAvanzados ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={() => setFiltrosAvanzados(!filtrosAvanzados)}
          >
            Filtros
          </Button>
        </Box>

        {/* Filtros avanzados */}
        <Collapse in={filtrosAvanzados}>
          <Box
            display="flex" gap={3} flexWrap="wrap" alignItems="flex-start"
            sx={{ bgcolor: "grey.50", borderRadius: 2, p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}
          >
            <TextField
              size="small" label="Fecha desde" type="date"
              value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
            />
            <TextField
              size="small" label="Fecha hasta" type="date"
              value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
            />
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                PCL: {pclRango[0]}% — {pclRango[1]}%
              </Typography>
              <Slider
                value={pclRango} onChange={(_, v) => setPclRango(v)}
                valueLabelDisplay="auto" min={0} max={100} step={5}
                marks={[{ value: 0, label: "0%" }, { value: 50, label: "50%" }, { value: 100, label: "100%" }]}
                size="small"
              />
            </Box>
            <Button
              size="small" color="error" variant="text"
              onClick={() => { setFechaDesde(""); setFechaHasta(""); setPclRango([0, 100]); setFiltroEstado(""); setBusqueda(""); }}
            >
              Limpiar todo
            </Button>
          </Box>
        </Collapse>

        <Box mb={2} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : evaluaciones.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="h6" color="text.secondary">
              {busquedaDebounced
                ? `Sin resultados para "${busquedaDebounced}"`
                : "No hay evaluaciones registradas"}
            </Typography>
            {!busquedaDebounced && canCreate() && (
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/evaluations/new")}>
                Crear primera evaluación
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell>Diagnóstico</TableCell>
                    <TableCell align="center">PCL %</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center" width={160}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluaciones.map((ev) => (
                    <TableRow key={ev._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {ev.paciente.nombreCompleto}
                        </Typography>
                        {ev.informacionDictamen?.numeroDictamen && (
                          <Typography variant="caption" color="text.secondary">
                            {ev.informacionDictamen.numeroDictamen}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ev.paciente.cedula}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {ev.diagnosticoPrincipal.codigo} —{" "}
                          {limpiarHTML(ev.diagnosticoPrincipal.nombre).substring(0, 38)}
                          {limpiarHTML(ev.diagnosticoPrincipal.nombre).length > 38 && "…"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {ev.porcentajePCL}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fmtFecha(ev.fechaEvaluacion)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.8} flexWrap="wrap">
                          <Chip
                            label={ESTADO_LABEL[ev.estado] || ev.estado}
                            color={ESTADO_COLOR[ev.estado] || "default"}
                            size="small"
                          />
                          {(() => {
                            const sem = calcularSemaforo(ev);
                            return sem ? (
                              <Box sx={{
                                bgcolor: sem.color, color: "white", borderRadius: 1,
                                px: 0.8, py: 0.2, fontSize: "0.68rem", fontWeight: "bold",
                              }}>
                                {sem.label}
                              </Box>
                            ) : null;
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary"
                          title="Ver detalle" onClick={() => navigate(`/evaluations/${ev._id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {canEdit() && (
                          <IconButton size="small" color="info"
                            title="Editar" onClick={() => navigate(`/evaluations/${ev._id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" color="secondary"
                          title="Descargar PDF" onClick={() => generarPDFDictamen(ev)}>
                          <PictureAsPdfIcon fontSize="small" />
                        </IconButton>
                        {canDelete() && (
                          <IconButton size="small" color="error"
                            title="Eliminar" onClick={() => handleEliminar(ev._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                <Typography variant="caption" color="text.secondary">
                  Página {page} de {totalPages}
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, val) => setPage(val)}
                  color="primary"
                  shape="rounded"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
