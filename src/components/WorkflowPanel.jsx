import { useState } from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { cambiarEstadoEvaluacion } from "../services/evaluationService";
import { canManageWorkflow } from "../utils/auth";

// ─── Configuración de etapas ────────────────────────────────────────────────
const ETAPAS = [
  {
    key: "borrador",
    label: "Borrador",
    desc: "Dictamen en elaboración",
    chipColor: "default",
    dotColor: "#9e9e9e",
    plazo: null,
    siguientes: [{ key: "primera_oportunidad", label: "Emitir dictamen" }],
  },
  {
    key: "primera_oportunidad",
    label: "1a Oportunidad",
    desc: "Dictamen emitido — 5 días calendario para impugnar",
    chipColor: "info",
    dotColor: "#0288d1",
    plazo: 5,
    plazoLabel: "5 días para impugnar",
    siguientes: [
      { key: "segunda_oportunidad", label: "Impugnado → 2a Oportunidad", color: "primary" },
      { key: "aprobado", label: "No impugnado → Ejecutoriado", color: "success" },
    ],
  },
  {
    key: "segunda_oportunidad",
    label: "2a Oportunidad",
    desc: "Recalificación por la entidad — 30 días calendario",
    chipColor: "info",
    dotColor: "#0277bd",
    plazo: 30,
    plazoLabel: "30 días calendario para recalificar",
    siguientes: [
      { key: "primera_instancia", label: "Aún en desacuerdo → Junta Regional", color: "primary" },
      { key: "aprobado", label: "Aceptado → Ejecutoriado", color: "success" },
    ],
  },
  {
    key: "primera_instancia",
    label: "Junta Regional",
    desc: "Primera instancia — 30 días hábiles para resolver",
    chipColor: "warning",
    dotColor: "#ed6c02",
    plazo: 45,
    plazoLabel: "45 días calendario (≈ 30 hábiles)",
    siguientes: [
      { key: "segunda_instancia", label: "Apelado → Junta Nacional", color: "primary" },
      { key: "aprobado", label: "Confirmado → Ejecutoriado", color: "success" },
    ],
  },
  {
    key: "segunda_instancia",
    label: "Junta Nacional",
    desc: "Segunda instancia — 30 días hábiles para resolver",
    chipColor: "error",
    dotColor: "#c62828",
    plazo: 45,
    plazoLabel: "45 días calendario (≈ 30 hábiles)",
    siguientes: [
      { key: "aprobado", label: "Resuelto → Ejecutoriado", color: "success" },
    ],
  },
  {
    key: "aprobado",
    label: "Ejecutoriado",
    desc: "Dictamen en firme",
    chipColor: "success",
    dotColor: "#2e7d32",
    plazo: null,
    siguientes: [
      { key: "recalificacion", label: "Iniciar Recalificación", color: "warning" },
    ],
  },
  {
    key: "recalificacion",
    label: "Recalificación",
    desc: "Proceso de recalificación activo — nueva evaluación",
    chipColor: "warning",
    dotColor: "#f57c00",
    plazo: null,
    siguientes: [
      { key: "primera_oportunidad", label: "Emitir nuevo dictamen", color: "primary" },
    ],
  },
];

// Mapeo de estados legacy al índice del stepper (7 etapas ahora)
const LEGACY_STEP = { completada: 1, revisada: 3, aprobada: 5 };

const formatFecha = (fecha) => {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const calcularDiasRestantes = (fechaEntrada, plazoDias) => {
  if (!fechaEntrada || !plazoDias) return null;
  const limite = new Date(new Date(fechaEntrada).getTime() + plazoDias * 86400000);
  return Math.ceil((limite - new Date()) / 86400000);
};

const semaforoSeverity = (dias) => {
  if (dias === null) return null;
  if (dias > 10) return "success";
  if (dias >= 3) return "warning";
  return "error";
};

// ─── Componente ─────────────────────────────────────────────────────────────
export default function WorkflowPanel({ evaluacion, onActualizado }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [observacion, setObservacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const estadoActual = evaluacion.estado || "borrador";
  const etapaActual = ETAPAS.find((e) => e.key === estadoActual);
  const stepIndex = etapaActual
    ? ETAPAS.findIndex((e) => e.key === estadoActual)
    : LEGACY_STEP[estadoActual] ?? 0;

  const historial = evaluacion.historialEstados || [];

  // Fecha de entrada al estado actual (primera vez que aparece en historial)
  const entradaActual = [...historial]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .find((h) => h.estado === estadoActual);

  const diasRestantes =
    etapaActual?.plazo != null
      ? calcularDiasRestantes(entradaActual?.fecha, etapaActual.plazo)
      : null;

  const abrirDialog = (sig) => {
    setTarget(sig);
    setObservacion("");
    setError("");
    setDialogOpen(true);
  };

  const confirmar = async () => {
    if (!target) return;
    setLoading(true);
    setError("");
    try {
      await cambiarEstadoEvaluacion(evaluacion._id, {
        nuevoEstado: target.key,
        observacion,
      });
      setDialogOpen(false);
      if (onActualizado) onActualizado();
    } catch (err) {
      setError(err?.response?.data?.message || "Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header con estado actual */}
      <Box display="flex" alignItems="center" gap={1.5} mb={2} flexWrap="wrap">
        <Typography variant="h6" fontWeight="bold">
          Estado del Dictamen
        </Typography>
        <Chip
          label={etapaActual?.label || estadoActual}
          color={etapaActual?.chipColor || "default"}
          size="small"
          icon={estadoActual === "aprobado" ? <CheckCircleIcon /> : undefined}
        />
        {entradaActual && (
          <Typography variant="caption" color="text.secondary">
            Desde {formatFecha(entradaActual.fecha)}
          </Typography>
        )}
      </Box>

      {/* Alerta de plazo */}
      {diasRestantes !== null && (
        <Alert severity={semaforoSeverity(diasRestantes)} sx={{ mb: 2 }}>
          {diasRestantes > 0
            ? `Plazo: ${etapaActual.plazoLabel} — quedan aproximadamente ${diasRestantes} días`
            : `Plazo vencido hace ${Math.abs(diasRestantes)} días`}
        </Alert>
      )}

      {/* Stepper visual */}
      <Stepper activeStep={stepIndex} alternativeLabel sx={{ mb: 3 }}>
        {ETAPAS.map((etapa, idx) => {
          const entrada = [...historial]
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .find((h) => h.estado === etapa.key);
          return (
            <Step key={etapa.key} completed={idx < stepIndex}>
              <StepLabel
                optional={
                  entrada ? (
                    <Typography variant="caption" display="block" textAlign="center">
                      {formatFecha(entrada.fecha)}
                    </Typography>
                  ) : undefined
                }
              >
                {etapa.label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {/* Botones de transición */}
      {canManageWorkflow() && (etapaActual?.siguientes?.length ?? 0) > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Avanzar instancia:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {etapaActual.siguientes.map((sig) => (
              <Button
                key={sig.key}
                variant="contained"
                size="small"
                color={sig.color || "primary"}
                onClick={() => abrirDialog(sig)}
              >
                {sig.label}
              </Button>
            ))}
          </Stack>
        </Box>
      )}

      {/* Historial de estados */}
      {historial.length > 0 && (
        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Historial
          </Typography>
          {[...historial]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((entrada, idx) => {
              const etapa = ETAPAS.find((e) => e.key === entrada.estado);
              return (
                <Box key={idx} display="flex" gap={1.5} mb={1.5} alignItems="flex-start">
                  <FiberManualRecordIcon
                    fontSize="small"
                    sx={{ color: etapa?.dotColor || "#9e9e9e", mt: 0.3, flexShrink: 0 }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {etapa?.label || entrada.estado}{" "}
                      <Typography component="span" variant="caption" color="text.secondary">
                        — {formatFecha(entrada.fecha)}
                      </Typography>
                    </Typography>
                    {entrada.observacion && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {entrada.observacion}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
        </Box>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar: {target?.label}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Observación (opcional)"
            multiline
            rows={3}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: Impugnado por el asegurado el día..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={target?.color || "primary"}
            onClick={confirmar}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
