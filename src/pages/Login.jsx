import { useState } from "react";
import {
  Avatar,
  Button,
  TextField,
  Box,
  Typography,
  Container,
  Link,
  Paper
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", form);

    // simulamos login correcto
    navigate("/dashboard");
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
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              Entrar
            </Button>

            <Box textAlign="center" mt={2}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/register")}
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
