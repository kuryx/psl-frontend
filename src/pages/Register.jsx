import api from "../services/api";
import { useState } from "react";
import {
  Avatar, Button, TextField, Box, Typography, Container, Link,
  Paper, MenuItem, FormControlLabel, Checkbox, Alert,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", cedula: "", role: "", password: "", confirmPassword: "",
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden"); return;
    }
    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones y la política de habeas data."); return;
    }

    setLoading(true);
    try {
      await api.post("/register", {
        name: form.name,
        email: form.email,
        cedula: form.cedula,
        role: form.role,
        password: form.password,
        aceptaTerminos: true,
      });
      navigate("/", { state: { mensaje: "Registro exitoso. Revisa tu correo para verificar tu cuenta." } });
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar");
    } finally { setLoading(false); }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ bgcolor: "secondary.main", mb: 1 }}>
            <PersonAddIcon />
          </Avatar>
          <Typography component="h1" variant="h5">Registro de usuario</Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: "100%" }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField fullWidth required margin="normal" label="Nombre completo"
              name="name" value={form.name} onChange={handleChange} />

            <TextField fullWidth required margin="normal" label="Correo electrónico"
              name="email" type="email" value={form.email} onChange={handleChange} />

            <TextField fullWidth required margin="normal" label="Cédula"
              name="cedula" value={form.cedula} onChange={handleChange} />

            <TextField fullWidth required select margin="normal" label="Rol"
              name="role" value={form.role} onChange={handleChange}>
              <MenuItem value="Médico Calificador">Médico Calificador</MenuItem>
              <MenuItem value="Coordinador">Coordinador</MenuItem>
              <MenuItem value="Paciente">Paciente</MenuItem>
            </TextField>

            <TextField fullWidth required margin="normal" label="Contraseña"
              name="password" type="password" value={form.password} onChange={handleChange} />

            <TextField fullWidth required margin="normal" label="Confirmar contraseña"
              name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />

            {/* ── Habeas Data / T&C ── */}
            <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    color="primary"
                    required
                  />
                }
                label={
                  <Typography variant="body2">
                    He leído y acepto los{" "}
                    <Link href="#" target="_blank" rel="noopener">Términos y Condiciones</Link>
                    {" "}y autorizo el tratamiento de mis datos personales de acuerdo con la{" "}
                    <Link href="#" target="_blank" rel="noopener">Política de Habeas Data</Link>
                    {" "}conforme a la Ley 1581 de 2012.
                  </Typography>
                }
              />
            </Box>

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }} disabled={loading || !aceptaTerminos}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>

            <Box textAlign="center" mt={2}>
              <Link component="button" variant="body2" onClick={() => navigate("/")}>
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
