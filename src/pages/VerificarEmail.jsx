import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Button, Paper } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import api from "../services/api";

export default function VerificarEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    api.get(`/verificar-email/${token}`)
      .then(({ data }) => { setMensaje(data.message); setEstado("ok"); })
      .catch((err) => { setMensaje(err.response?.data?.message || "Error al verificar."); setEstado("error"); });
  }, [token]);

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f7fa">
      <Paper elevation={4} sx={{ p: 5, maxWidth: 440, textAlign: "center", borderRadius: 3 }}>
        {estado === "cargando" && (
          <>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography variant="h6">Verificando tu cuenta…</Typography>
          </>
        )}

        {estado === "ok" && (
          <>
            <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" mb={1}>¡Cuenta verificada!</Typography>
            <Typography color="text.secondary" mb={3}>{mensaje}</Typography>
            <Button variant="contained" size="large" onClick={() => navigate("/")}>
              Iniciar sesión
            </Button>
          </>
        )}

        {estado === "error" && (
          <>
            <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" mb={1}>Enlace inválido</Typography>
            <Typography color="text.secondary" mb={3}>{mensaje}</Typography>
            <Button variant="outlined" onClick={() => navigate("/")}>Ir al inicio</Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
