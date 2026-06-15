import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { obtenerAuditEvaluacion } from "../services/auditService";

const ACCION_CONFIG = {
  crear:         { label: "Creación",         color: "success", Icon: AddCircleIcon },
  actualizar:    { label: "Actualización",     color: "primary", Icon: EditIcon },
  cambiar_estado:{ label: "Cambio de estado",  color: "warning", Icon: SwapHorizIcon },
  eliminar:      { label: "Eliminación",       color: "error",   Icon: DeleteForeverIcon },
};

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

function EntradaLog({ log }) {
  const [abierto, setAbierto] = useState(false);
  const cfg = ACCION_CONFIG[log.accion] || { label: log.accion, color: "default", Icon: EditIcon };
  const { Icon } = cfg;

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "flex-start" }}>
      {/* Ícono */}
      <Box sx={{ mt: 0.3, flexShrink: 0 }}>
        <Icon fontSize="small" color={cfg.color} />
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {/* Cabecera */}
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Chip label={cfg.label} color={cfg.color} size="small" />
          <Typography variant="caption" color="text.secondary">
            {formatFecha(log.fecha)}
          </Typography>
          <Typography variant="caption" fontWeight="bold">
            {log.usuario?.nombre || log.usuario?.email || "Sistema"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({log.usuario?.role})
          </Typography>
          {log.cambios?.length > 0 && (
            <IconButton size="small" onClick={() => setAbierto(!abierto)} sx={{ ml: "auto" }}>
              {abierto ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>

        {/* Estado anterior → nuevo (solo cambio_estado) */}
        {log.accion === "cambiar_estado" && log.metadatos && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>{log.metadatos.estadoAnterior}</strong>
            {" → "}
            <strong>{log.metadatos.estadoNuevo}</strong>
            {log.metadatos.observacion && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                — {log.metadatos.observacion}
              </Typography>
            )}
          </Typography>
        )}

        {/* Detalle de campos modificados */}
        <Collapse in={abierto}>
          <Box sx={{ mt: 1, pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
            {log.cambios.map((c, i) => (
              <Box key={i} sx={{ mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold">{c.campo}:</Typography>{" "}
                <Typography variant="caption" sx={{ textDecoration: "line-through", color: "error.main" }}>
                  {String(c.antes) || "(vacío)"}
                </Typography>
                {" → "}
                <Typography variant="caption" sx={{ color: "success.main" }}>
                  {String(c.despues) || "(vacío)"}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default function AuditTimeline({ evaluacionId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerAuditEvaluacion(evaluacionId)
      .then((data) => setLogs(data.logs))
      .catch(() => setError("No se pudo cargar el historial de auditoría"))
      .finally(() => setLoading(false));
  }, [evaluacionId]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Auditoría
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {loading && <CircularProgress size={20} />}
      {error && <Alert severity="warning" sx={{ mb: 1 }}>{error}</Alert>}

      {!loading && logs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Sin registros de auditoría.
        </Typography>
      )}

      {logs.map((log) => (
        <EntradaLog key={log._id} log={log} />
      ))}
    </Box>
  );
}
