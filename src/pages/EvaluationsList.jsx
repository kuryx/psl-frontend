import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container, Paper, Typography, Button, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  TextField, MenuItem, CircularProgress, Alert, InputAdornment, Pagination,
  Collapse, Slider, Tooltip, TableSortLabel,
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

const ORIGEN_COLOR = {
  "Enfermedad común":    { bg: "#e3f2fd", text: "#1565c0" },
  "Enfermedad laboral":  { bg: "#fff3e0", text: "#e65100" },
  "Accidente de trabajo":{ bg: "#fce4ec", text: "#880e4f" },
  "Accidente común":     { bg: "#f3e5f5", text: "#6a1b9a" },
};

const fmtFecha = (f) =>
  new Date(f).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

// ─── Orden local sobre los datos de la página actual ─────────────────────────
const ordenarDatos = (datos, campo, dir) => {
  if (!campo) return datos;
  return [...datos].sort((a, b) => {
    let va, vb;
    if (campo === "pcl")    { va = a.porcentajePCL ?? 0;          vb = b.porcentajePCL ?? 0; }
    if (campo === "fecha")  { va = new Date(a.fechaEvaluacion);   vb = new Date(b.fechaEvaluacion); }
    if (campo === "nombre") { va = a.paciente?.nombreCompleto || ""; vb = b.paciente?.nombreCompleto || ""; }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
};

export default function EvaluationsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const busquedaInicial = new URLSearchParams(location.search).get("busqueda") || "";

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("");
  const [busqueda, setBusqueda]         = useState(busquedaInicial);
  const [busquedaDebounced, setBusquedaDebounced] = useState(busquedaInicial);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState(false);
  const [fechaDesde, setFechaDesde]     = useState("");
  const [fechaHasta, setFechaHasta]     = useState("");
  const [pclRango, setPclRango]         = useState([0, 100]);
  const [ordenCampo, setOrdenCampo]     = useState("fecha");
  const [ordenDir, setOrdenDir]         = useState("desc");

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setBusquedaDebounced(busqueda); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Reset page cuando cambian filtros
  useEffect(() => { setPage(1); }, [filtroEstado, filtroOrigen, fechaDesde, fechaHasta, pclRango]);

  useEffect(() => { cargar(); }, [filtroEstado, filtroOrigen, busquedaDebounced, page, fechaDesde, fechaHasta, pclRango]); // eslint-disable-line

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: LIMIT };
      if (filtroEstado)             params.estado    = filtroEstado;
      if (filtroOrigen)             params.origen    = filtroOrigen;
      if (busquedaDebounced.trim()) params.busqueda  = busquedaDebounced.trim();
      if (fechaDesde)               params.fechaDesde = fechaDesde;
      if (fechaHasta)               params.fechaHasta = fechaHasta;
      if (pclRango[0] > 0)          params.pclMin    = pclRango[0];
      if (pclRango[1] < 100)        params.pclMax    = pclRango[1];
      const data = await listarEvaluaciones(params);
      setEvaluaciones(data.evaluaciones);
      setTotal(data.total);
      setTotalPages(data.totalPages || Math.ceil(data.total / LIMIT));
    } catch {
      setError("Error al cargar evaluaciones");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroOrigen, busquedaDebounced, page, fechaDesde, fechaHasta, pclRango]);

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
      if (filtroOrigen) params.origen = filtroOrigen;
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

  const handleOrden = (campo) => {
    if (ordenCampo === campo) {
      setOrdenDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdenCampo(campo);
      setOrdenDir("desc");
    }
  };

  const limpiarFiltros = () => {
    setFechaDesde(""); setFechaHasta("");
    setPclRango([0, 100]); setFiltroEstado("");
    setFiltroOrigen(""); setBusqueda("");
  };

  const hayFiltrosActivos = filtroEstado || filtroOrigen || fechaDesde || fechaHasta
    || pclRango[0] > 0 || pclRango[1] < 100 || busquedaDebounced;

  const evaluacionesOrdenadas = ordenarDatos(evaluaciones, ordenCampo, ordenDir);

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
                {hayFiltrosActivos && " (filtros activos)"}
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
          <TextField
            select size="small" label="Origen"
            value={filtroOrigen}
            onChange={(e) => setFiltroOrigen(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos los orígenes</MenuItem>
            <MenuItem value="Enfermedad común">Enfermedad común</MenuItem>
            <MenuItem value="Enfermedad laboral">Enfermedad laboral</MenuItem>
            <MenuItem value="Accidente de trabajo">Accidente de trabajo</MenuItem>
            <MenuItem value="Accidente común">Accidente común</MenuItem>
          </TextField>
          <Button
            size="small" variant={filtrosAvanzados ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={() => setFiltrosAvanzados(!filtrosAvanzados)}
          >
            Más filtros
          </Button>
          {hayFiltrosActivos && (
            <Button size="small" color="error" variant="text" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          )}
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
            <Box sx={{ minWidth: 220 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Rango PCL: {pclRango[0]}% — {pclRango[1]}%
              </Typography>
              <Slider
                value={pclRango} onChange={(_, v) => setPclRango(v)}
                valueLabelDisplay="auto" min={0} max={100} step={5}
                marks={[{ value: 0, label: "0%" }, { value: 50, label: "50%" }, { value: 100, label: "100%" }]}
                size="small"
              />
            </Box>
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
                : "No hay evaluaciones con los filtros aplicados"}
            </Typography>
            {!hayFiltrosActivos && canCreate() && (
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/evaluations/new")}>
                Crear primera evaluación
              </Button>
            )}
            {hayFiltrosActivos && (
              <Button variant="outlined" sx={{ mt: 2 }} onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                    <TableCell sx={{ minWidth: 80 }}>
                      N° Dictamen
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <TableSortLabel
                        active={ordenCampo === "nombre"}
                        direction={ordenCampo === "nombre" ? ordenDir : "asc"}
                        onClick={() => handleOrden("nombre")}
                      >
                        Paciente
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Diagnóstico principal</TableCell>
                    <TableCell align="center" sx={{ minWidth: 70 }}>
                      <TableSortLabel
                        active={ordenCampo === "pcl"}
                        direction={ordenCampo === "pcl" ? ordenDir : "desc"}
                        onClick={() => handleOrden("pcl")}
                      >
                        PCL %
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Origen</TableCell>
                    <TableCell sx={{ minWidth: 95 }}>
                      <TableSortLabel
                        active={ordenCampo === "fecha"}
                        direction={ordenCampo === "fecha" ? ordenDir : "desc"}
                        onClick={() => handleOrden("fecha")}
                      >
                        Fecha
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>Estado</TableCell>
                    <TableCell align="center" sx={{ minWidth: 140 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluacionesOrdenadas.map((ev) => {
                    const origenStyle = ORIGEN_COLOR[ev.origen] || { bg: "#f5f5f5", text: "#555" };
                    return (
                      <TableRow key={ev._id} hover sx={{ cursor: "pointer" }}
                        onClick={() => navigate(`/evaluations/${ev._id}`)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                            {ev.informacionDictamen?.numeroDictamen || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Typography variant="body2" fontWeight="medium">
                            {ev.paciente.nombreCompleto}
                          </Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Typography variant="body2">{ev.paciente.cedula}</Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip title={limpiarHTML(ev.diagnosticoPrincipal.nombre)} arrow>
                            <Typography variant="body2">
                              <strong>{ev.diagnosticoPrincipal.codigo}</strong>{" "}
                              {limpiarHTML(ev.diagnosticoPrincipal.nombre).substring(0, 35)}
                              {limpiarHTML(ev.diagnosticoPrincipal.nombre).length > 35 && "…"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Typography
                            variant="body2" fontWeight="bold"
                            color={ev.porcentajePCL >= 50 ? "error.main" : "primary.main"}
                          >
                            {ev.porcentajePCL}%
                          </Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {ev.origen ? (
                            <Box sx={{
                              display: "inline-block",
                              bgcolor: origenStyle.bg, color: origenStyle.text,
                              borderRadius: 1, px: 1, py: 0.3,
                              fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
                            }}>
                              {ev.origen}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Typography variant="body2">{fmtFecha(ev.fechaEvaluacion)}</Typography>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" color="primary"
                              onClick={() => navigate(`/evaluations/${ev._id}`)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canEdit() && (
                            <Tooltip title="Editar">
                              <IconButton size="small" color="info"
                                onClick={() => navigate(`/evaluations/${ev._id}/edit`)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Descargar PDF">
                            <IconButton size="small" color="secondary"
                              onClick={() => generarPDFDictamen(ev)}>
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canDelete() && (
                            <Tooltip title="Eliminar">
                              <IconButton size="small" color="error"
                                onClick={() => handleEliminar(ev._id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                <Typography variant="caption" color="text.secondary">
                  Página {page} de {totalPages} — {total} resultados
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
