import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import api from "../services/api";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Ingresa tu email"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/recuperar-password", { email });
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el email");
    } finally { setLoading(false); }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f7fa">
      <Paper elevation={4} sx={{ p: 5, maxWidth: 420, width: "100%", borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <LockResetIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">¿Olvidaste tu contraseña?</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Ingresa tu email y te enviaremos un enlace para restablecerla.
          </Typography>
        </Box>

        {enviado ? (
          <Alert severity="success">
            Revisa tu bandeja de entrada. Si el email está registrado, recibirás el enlace en breve.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }} autoFocus
            />
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}>
              Enviar enlace
            </Button>
          </form>
        )}

        <Box textAlign="center" mt={3}>
          <Link to="/" style={{ color: "#1976d2", fontSize: 14 }}>← Volver al inicio de sesión</Link>
        </Box>
      </Paper>
    </Box>
  );
}
