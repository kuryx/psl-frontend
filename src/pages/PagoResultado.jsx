import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography, Button, Paper, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import api from "../services/api";
import { getCurrentUser, login, getToken } from "../utils/auth";

export default function PagoResultado() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("cargando");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    const referencia = params.get("id") || params.get("reference");
    if (!referencia) { setEstado("error"); return; }

    // Espera 2s para que el webhook llegue antes de verificar
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/pagos/verificar/${referencia}`);
        if (data.plan && data.plan !== "free") {
          // Actualizar localStorage con el nuevo plan
          const user = getCurrentUser();
          if (user) login(getToken(), { ...user, plan: data.plan, planVence: data.planVence });
          setPlan(data.plan);
          setEstado("ok");
        } else {
          setEstado("pendiente");
        }
      } catch {
        setEstado("error");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [params]);

  const LABEL = { profesional: "Profesional", empresarial: "Empresarial" };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f7fa">
      <Paper elevation={4} sx={{ p: 5, maxWidth: 440, textAlign: "center", borderRadius: 3 }}>
        {estado === "cargando" && (
          <>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography variant="h6">Verificando tu pago…</Typography>
          </>
        )}

        {estado === "ok" && (
          <>
            <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" mb={1}>¡Pago exitoso!</Typography>
            <Typography color="text.secondary" mb={1}>
              Tu plan <strong>{LABEL[plan] || plan}</strong> ya está activo.
            </Typography>
            <Alert severity="success" sx={{ mb: 3, textAlign: "left" }}>
              Ahora tienes evaluaciones ilimitadas y acceso completo a la IA.
            </Alert>
            <Button variant="contained" size="large" onClick={() => navigate("/dashboard")}>
              Ir al Dashboard
            </Button>
          </>
        )}

        {estado === "pendiente" && (
          <>
            <HourglassEmptyIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" mb={1}>Pago en proceso</Typography>
            <Typography color="text.secondary" mb={3}>
              Tu pago está siendo procesado. En unos minutos tu plan se actualizará. Si el problema persiste, escríbenos.
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/dashboard")}>Volver al inicio</Button>
          </>
        )}

        {estado === "error" && (
          <>
            <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" mb={1}>No pudimos verificar el pago</Typography>
            <Typography color="text.secondary" mb={3}>
              Si realizaste el pago, contáctanos con tu referencia de transacción.
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/planes")}>Ver planes</Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
