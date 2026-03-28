import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getCurrentUser } from "../utils/auth";
import api from "../services/api";

export default function MiCuenta() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [editandoPassword, setEditandoPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [perfil, setPerfil] = useState({
    name: user?.name || "",
    email: user?.email || "",
    cedula: user?.cedula || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePerfilChange = (field, value) => {
    setPerfil({ ...perfil, [field]: value });
  };

  const handlePasswordChange = (field, value) => {
    setPasswords({ ...passwords, [field]: value });
  };

  const handleGuardarPerfil = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validaciones
      if (!perfil.name || !perfil.email || !perfil.cedula) {
        setError("Todos los campos son obligatorios");
        setLoading(false);
        return;
      }

      const response = await api.put("/users/profile", perfil);
      
      // Actualizar localStorage con nueva información
      const updatedUser = { ...user, ...perfil };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess("Perfil actualizado correctamente");
      setEditandoPerfil(false);
    } catch (error) {
      setError(error.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validaciones
      if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
        setError("Todos los campos de contraseña son obligatorios");
        setLoading(false);
        return;
      }

      if (passwords.newPassword !== passwords.confirmPassword) {
        setError("Las contraseñas nuevas no coinciden");
        setLoading(false);
        return;
      }

      if (passwords.newPassword.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      await api.put("/users/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setSuccess("Contraseña cambiada correctamente");
      setEditandoPassword(false);
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setPerfil({
      name: user?.name || "",
      email: user?.email || "",
      cedula: user?.cedula || "",
    });
    setEditandoPerfil(false);
    setError("");
    setSuccess("");
  };

  const handleCancelarPassword = () => {
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setEditandoPassword(false);
    setError("");
    setSuccess("");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 64,
              height: 64,
              fontSize: 28,
              mr: 3,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Mi Cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona tu información personal
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* INFORMACIÓN DEL PERFIL */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Información Personal
              </Typography>
              {!editandoPerfil && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setEditandoPerfil(true)}
                  size="small"
                >
                  Editar
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={perfil.name}
                  onChange={(e) => handlePerfilChange("name", e.target.value)}
                  disabled={!editandoPerfil}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={perfil.cedula}
                  onChange={(e) => handlePerfilChange("cedula", e.target.value)}
                  disabled={!editandoPerfil}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={perfil.email}
                  onChange={(e) => handlePerfilChange("email", e.target.value)}
                  disabled={!editandoPerfil}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rol"
                  value={user?.role || "Usuario"}
                  disabled
                />
              </Grid>
            </Grid>

            {editandoPerfil && (
              <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelar}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardarPerfil}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* CAMBIAR CONTRASEÑA */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Seguridad
              </Typography>
              {!editandoPassword && (
                <Button
                  startIcon={<LockIcon />}
                  onClick={() => setEditandoPassword(true)}
                  size="small"
                >
                  Cambiar Contraseña
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {!editandoPassword ? (
              <Typography variant="body2" color="text.secondary">
                Haz clic en "Cambiar Contraseña" para actualizar tu contraseña
              </Typography>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contraseña Actual"
                    type={showPassword ? "text" : "password"}
                    value={passwords.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nueva Contraseña"
                    type={showNewPassword ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    required
                    helperText="Mínimo 6 caracteres"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirmar Nueva Contraseña"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            )}

            {editandoPassword && (
              <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelarPassword}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleCambiarPassword}
                  disabled={loading}
                >
                  {loading ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}