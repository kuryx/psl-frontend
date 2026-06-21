import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import api from "../services/api";

export default function NuevaContrasena() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/nueva-contrasena", { token, password });
      setListo(true);
    } catch (err) {
      setError(err.response?.data?.message || "El enlace es inválido o ha expirado.");
    } finally { setLoading(false); }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f7fa">
      <Paper elevation={4} sx={{ p: 5, maxWidth: 420, width: "100%", borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <LockIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">Nueva contraseña</Typography>
        </Box>

        {listo ? (
          <>
            <Box textAlign="center" mb={2}>
              <CheckCircleIcon sx={{ fontSize: 56, color: "success.main" }} />
            </Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Contraseña actualizada correctamente.
            </Alert>
            <Button fullWidth variant="contained" size="large" onClick={() => navigate("/")}>
              Ir al inicio de sesión
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth label="Nueva contraseña" type={mostrar ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }} autoFocus
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setMostrar(!mostrar)} edge="end">
                      {mostrar ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth label="Confirmar contraseña" type={mostrar ? "text" : "password"}
              value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}>
              Guardar contraseña
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}
