import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  InputAdornment, CircularProgress, Alert, Pagination, Avatar, Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { listarPacientes } from "../services/evaluationService";

const LIMIT = 20;

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

const fmtFecha = (f) => f
  ? new Date(f).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
  : "—";

const iniciales = (nombre = "") => {
  const partes = nombre.trim().split(" ").filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return nombre.slice(0, 2).toUpperCase();
};

export default function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => { setBusquedaDebounced(busqueda); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: LIMIT };
      if (busquedaDebounced.trim()) params.busqueda = busquedaDebounced.trim();
      const data = await listarPacientes(params);
      setPacientes(data.pacientes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Error al cargar el directorio de pacientes");
    } finally {
      setLoading(false);
    }
  }, [busquedaDebounced, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const verHistorial = (cedula) => navigate(`/evaluations?busqueda=${cedula}`);
  const nuevaEval = (cedula) => navigate(`/evaluations/new?cedula=${cedula}`);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>

        {/* Encabezado */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <PeopleIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">Directorio de Pacientes</Typography>
              {!loading && (
                <Typography variant="caption" color="text.secondary">
                  {total} {total === 1 ? "paciente registrado" : "pacientes registrados"}
                </Typography>
              )}
            </Box>
          </Box>

          <TextField
            size="small"
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ minWidth: 280 }}
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
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : pacientes.length === 0 ? (
          <Box textAlign="center" py={8}>
            <PeopleIcon sx={{ fontSize: 56, color: "text.disabled" }} />
            <Typography variant="h6" color="text.secondary" mt={1}>
              {busquedaDebounced ? `Sin resultados para "${busquedaDebounced}"` : "No hay pacientes registrados"}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Identificación</TableCell>
                    <TableCell align="center">Evaluaciones</TableCell>
                    <TableCell align="center">Última PCL</TableCell>
                    <TableCell>Último estado</TableCell>
                    <TableCell>Último dictamen</TableCell>
                    <TableCell>Última fecha</TableCell>
                    <TableCell align="center" width={100}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pacientes.map((p) => (
                    <TableRow key={p._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: "primary.main" }}>
                            {iniciales(p.nombreCompleto)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {p.nombreCompleto}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {p.tipoIdentificacion || "CC"} {p.cedula}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={p.totalEvaluaciones}
                          size="small"
                          color={p.totalEvaluaciones > 1 ? "primary" : "default"}
                          variant={p.totalEvaluaciones > 1 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2" fontWeight="bold"
                          color={p.ultimaPCL >= 50 ? "error.main" : p.ultimaPCL >= 33 ? "warning.main" : "success.main"}
                        >
                          {p.ultimaPCL != null ? `${p.ultimaPCL}%` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ESTADO_LABEL[p.ultimoEstado] || p.ultimoEstado || "—"}
                          color={ESTADO_COLOR[p.ultimoEstado] || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {p.ultimoDictamen || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {fmtFecha(p.ultimaFecha)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver todas las evaluaciones">
                          <IconButton size="small" color="primary" onClick={() => verHistorial(p.cedula)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Nueva evaluación para este paciente">
                          <IconButton size="small" color="success" onClick={() => nuevaEval(p.cedula)}>
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                <Typography variant="caption" color="text.secondary">
                  Página {page} de {totalPages}
                </Typography>
                <Pagination
                  count={totalPages} page={page}
                  onChange={(_, v) => setPage(v)}
                  color="primary" shape="rounded" size="small"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
