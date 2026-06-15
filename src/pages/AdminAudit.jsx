import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { obtenerAuditGeneral } from "../services/auditService";

const ACCION_COLOR = {
  crear: "success",
  actualizar: "primary",
  cambiar_estado: "warning",
  eliminar: "error",
};

const ACCION_LABEL = {
  crear: "Creación",
  actualizar: "Actualización",
  cambiar_estado: "Cambio estado",
  eliminar: "Eliminación",
};

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");

  useEffect(() => {
    cargar();
  }, [filtroAccion]);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filtroAccion) params.accion = filtroAccion;
      const data = await obtenerAuditGeneral(params);
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      setError("Error al cargar registros de auditoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Log de Auditoría
            </Typography>
            <Chip label={`${total} registros`} size="small" sx={{ ml: 1 }} />
          </Box>

          <TextField
            select size="small" label="Filtrar acción"
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="crear">Creación</MenuItem>
            <MenuItem value="actualizar">Actualización</MenuItem>
            <MenuItem value="cambiar_estado">Cambio de estado</MenuItem>
            <MenuItem value="eliminar">Eliminación</MenuItem>
          </TextField>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acción</TableCell>
                  <TableCell>Dictamen</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="caption">{formatFecha(log.fecha)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ACCION_LABEL[log.accion] || log.accion}
                        color={ACCION_COLOR[log.accion] || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {log.numeroDictamen || log.evaluacionId?.toString().slice(-6)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.usuario?.nombre || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.usuario?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{log.usuario?.role}</Typography>
                    </TableCell>
                    <TableCell>
                      {log.accion === "cambiar_estado" && log.metadatos ? (
                        <Typography variant="caption">
                          {log.metadatos.estadoAnterior} → {log.metadatos.estadoNuevo}
                          {log.metadatos.observacion && ` — ${log.metadatos.observacion}`}
                        </Typography>
                      ) : log.cambios?.length > 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          {log.cambios.length} campo(s) modificado(s):{" "}
                          {log.cambios.map((c) => c.campo).join(", ")}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
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
