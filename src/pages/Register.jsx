import api from "../services/api";
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
  MenuItem
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    cedula: "",
    role: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (form.password !== form.confirmPassword) {
    alert("Las contraseñas no coinciden");
    return;
  }

  try {
    await api.post("/register", {
      name: form.name,
      email: form.email,
      cedula: form.cedula,
      role: form.role,
      password: form.password
    });

    alert("Usuario registrado correctamente");
    navigate("/");
  } catch (error) {
    alert(error.response?.data?.message || "Error al registrar");
  }
};


  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ bgcolor: "secondary.main", mb: 1 }}>
            <PersonAddIcon />
          </Avatar>

          <Typography component="h1" variant="h5">
            Registro de usuario
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              required
              margin="normal"
              label="Nombre completo"
              name="name"
              value={form.name}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              margin="normal"
              label="Correo electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              margin="normal"
              label="Cédula"
              name="cedula"
              value={form.cedula}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              select
              margin="normal"
              label="Rol"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <MenuItem value="Administrador">Administrador</MenuItem>
              <MenuItem value="Médico evaluador">Médico evaluador</MenuItem>
              <MenuItem value="Usuario">Usuario</MenuItem>
            </TextField>

            <TextField
              fullWidth
              required
              margin="normal"
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              margin="normal"
              label="Confirmar contraseña"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              Registrarse
            </Button>

            <Box textAlign="center" mt={2}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/")}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
