import { useState } from "react";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Link,
  Paper,
  Alert
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { login } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Llamar al endpoint de login
      const response = await api.post("/login", {
        email: form.email,
        password: form.password
      });

      // Guardar token y datos del usuario
      login(response.data.token, response.data.user);

      // Redirigir al dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Error de login:", err);
      
      if (err.response) {
        // El servidor respondió con un error
        setError(err.response.data.message || "Error al iniciar sesión");
      } else if (err.request) {
        // La petición se hizo pero no hubo respuesta
        setError("No se pudo conectar con el servidor");
      } else {
        // Otro tipo de error
        setError("Error inesperado al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ bgcolor: "primary.main", mb: 1 }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography component="h1" variant="h5">
            Iniciar sesión
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              required
              margin="normal"
              label="Correo electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              fullWidth
              required
              margin="normal"
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Entrar"}
            </Button>

            <Box textAlign="center" mt={2}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/register")}
                type="button"
                disabled={loading}
              >
                ¿No tienes cuenta? Regístrate
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}