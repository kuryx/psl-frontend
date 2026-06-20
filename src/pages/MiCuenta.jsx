import { useState, useEffect } from "react";
import {
  Container, Paper, Typography, TextField, Button, Box, Grid,
  Alert, Card, CardContent, Divider, Avatar, IconButton,
  InputAdornment, MenuItem, CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import PaletteIcon from "@mui/icons-material/Palette";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LanguageIcon from "@mui/icons-material/Language";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getCurrentUser } from "../utils/auth";
import api from "../services/api";
import { usePreferences } from "../contexts/PreferencesContext";

const VACIO_PROFESIONAL = { especialidad: "", registroProfesional: "", cargo: "", nombrePiePagina: "" };
const VACIO_ENTIDAD = { nombre: "", identificacion: "", direccion: "", ciudad: "", telefono: "", correoElectronico: "" };

export default function MiCuenta() {
  const user = getCurrentUser();
  const { preferences, updatePreferences } = usePreferences();

  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [editandoProfesional, setEditandoProfesional] = useState(false);
  const [editandoEntidad, setEditandoEntidad] = useState(false);
  const [editandoPassword, setEditandoPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [perfil, setPerfil] = useState({ name: user?.name || "", email: user?.email || "", cedula: user?.cedula || "" });
  const [profesional, setProfesional] = useState(VACIO_PROFESIONAL);
  const [entidad, setEntidad] = useState(VACIO_ENTIDAD);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    api.get("/users/profile")
      .then(({ data }) => {
        setPerfil({ name: data.name || "", email: data.email || "", cedula: data.cedula || "" });
        setProfesional({ ...VACIO_PROFESIONAL, ...(data.datosProfesionales || {}) });
        setEntidad({ ...VACIO_ENTIDAD, ...(data.entidadCalificadora || {}) });
      })
      .catch(() => {})
      .finally(() => setLoadingPerfil(false));
  }, []);

  const notificar = (msg, tipo = "success") => {
    if (tipo === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  };

  const syncLocalStorage = (patch) => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, ...patch }));
  };

  const guardarPerfil = async () => {
    if (!perfil.name || !perfil.email || !perfil.cedula) {
      return notificar("Nombre, cédula y correo son obligatorios", "error");
    }
    setLoading(true);
    try {
      await api.put("/users/profile", perfil);
      syncLocalStorage(perfil);
      notificar("Perfil actualizado correctamente");
      setEditandoPerfil(false);
    } catch (e) { notificar(e.response?.data?.message || "Error al guardar", "error"); }
    finally { setLoading(false); }
  };

  const guardarProfesional = async () => {
    setLoading(true);
    try {
      await api.put("/users/profile", { ...perfil, datosProfesionales: profesional });
      syncLocalStorage({ datosProfesionales: profesional });
      notificar("Datos profesionales guardados");
      setEditandoProfesional(false);
    } catch (e) { notificar(e.response?.data?.message || "Error al guardar", "error"); }
    finally { setLoading(false); }
  };

  const guardarEntidad = async () => {
    setLoading(true);
    try {
      await api.put("/users/profile", { ...perfil, entidadCalificadora: entidad });
      syncLocalStorage({ entidadCalificadora: entidad });
      notificar("Entidad calificadora guardada");
      setEditandoEntidad(false);
    } catch (e) { notificar(e.response?.data?.message || "Error al guardar", "error"); }
    finally { setLoading(false); }
  };

  const cambiarPassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      return notificar("Todos los campos de contraseña son obligatorios", "error");
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return notificar("Las contraseñas nuevas no coinciden", "error");
    }
    if (passwords.newPassword.length < 6) {
      return notificar("La contraseña debe tener al menos 6 caracteres", "error");
    }
    setLoading(true);
    try {
      await api.put("/users/password", { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      notificar("Contraseña cambiada correctamente");
      setEditandoPassword(false);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) { notificar(e.response?.data?.message || "Error al cambiar contraseña", "error"); }
    finally { setLoading(false); }
  };

  if (loadingPerfil) return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64, fontSize: 28, mr: 3 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">Mi Cuenta</Typography>
            <Typography variant="body2" color="text.secondary">{user?.role || ""}</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* ── Información Personal ── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">Información Personal</Typography>
              {!editandoPerfil && (
                <Button startIcon={<EditIcon />} size="small" onClick={() => setEditandoPerfil(true)}>Editar</Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Nombre Completo" value={perfil.name}
                  onChange={(e) => setPerfil({ ...perfil, name: e.target.value })}
                  disabled={!editandoPerfil} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Cédula" value={perfil.cedula}
                  onChange={(e) => setPerfil({ ...perfil, cedula: e.target.value })}
                  disabled={!editandoPerfil} required />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth label="Correo Electrónico" type="email" value={perfil.email}
                  onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                  disabled={!editandoPerfil} required />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Rol" value={user?.role || "Usuario"} disabled />
              </Grid>
            </Grid>
            {editandoPerfil && (
              <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<CancelIcon />} disabled={loading}
                  onClick={() => { setPerfil({ name: user?.name || "", email: user?.email || "", cedula: user?.cedula || "" }); setEditandoPerfil(false); }}>
                  Cancelar
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarPerfil} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ── Datos Profesionales ── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <BadgeIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Datos Profesionales</Typography>
              </Box>
              {!editandoProfesional && (
                <Button startIcon={<EditIcon />} size="small" onClick={() => setEditandoProfesional(true)}>Editar</Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Estos datos se pre-rellenan automáticamente en cada nueva evaluación.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Especialidad / Cargo" value={profesional.especialidad}
                  onChange={(e) => setProfesional({ ...profesional, especialidad: e.target.value })}
                  disabled={!editandoProfesional}
                  placeholder="Ej: Médico Laboral, Médico Ocupacional..." />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Registro / Tarjeta Profesional" value={profesional.registroProfesional}
                  onChange={(e) => setProfesional({ ...profesional, registroProfesional: e.target.value })}
                  disabled={!editandoProfesional}
                  placeholder="No. de tarjeta profesional" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Cargo institucional" value={profesional.cargo}
                  onChange={(e) => setProfesional({ ...profesional, cargo: e.target.value })}
                  disabled={!editandoProfesional}
                  placeholder="Ej: Director médico, Calificador senior..." />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Nombre en pie de página del PDF"
                  value={profesional.nombrePiePagina}
                  onChange={(e) => setProfesional({ ...profesional, nombrePiePagina: e.target.value })}
                  disabled={!editandoProfesional}
                  placeholder="Ej: Edward Alfaro Sánchez"
                  helperText="Si se deja vacío, usa el nombre del perfil" />
              </Grid>
            </Grid>
            {editandoProfesional && (
              <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<CancelIcon />} disabled={loading}
                  onClick={() => setEditandoProfesional(false)}>Cancelar</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarProfesional} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ── Entidad Calificadora ── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <BusinessIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Entidad Calificadora</Typography>
              </Box>
              {!editandoEntidad && (
                <Button startIcon={<EditIcon />} size="small" onClick={() => setEditandoEntidad(true)}>Editar</Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              Estos datos se pre-rellenan en cada nueva evaluación y en el PDF del dictamen.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField fullWidth label="Nombre de la Entidad" value={entidad.nombre}
                  onChange={(e) => setEntidad({ ...entidad, nombre: e.target.value })}
                  disabled={!editandoEntidad} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="NIT / Identificación" value={entidad.identificacion}
                  onChange={(e) => setEntidad({ ...entidad, identificacion: e.target.value })}
                  disabled={!editandoEntidad} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Dirección" value={entidad.direccion}
                  onChange={(e) => setEntidad({ ...entidad, direccion: e.target.value })}
                  disabled={!editandoEntidad} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Ciudad" value={entidad.ciudad}
                  onChange={(e) => setEntidad({ ...entidad, ciudad: e.target.value })}
                  disabled={!editandoEntidad} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Teléfono" value={entidad.telefono}
                  onChange={(e) => setEntidad({ ...entidad, telefono: e.target.value })}
                  disabled={!editandoEntidad} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Correo Electrónico" type="email" value={entidad.correoElectronico}
                  onChange={(e) => setEntidad({ ...entidad, correoElectronico: e.target.value })}
                  disabled={!editandoEntidad} />
              </Grid>
            </Grid>
            {editandoEntidad && (
              <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<CancelIcon />} disabled={loading}
                  onClick={() => setEditandoEntidad(false)}>Cancelar</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarEntidad} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ── Seguridad ── */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">Seguridad</Typography>
              {!editandoPassword && (
                <Button startIcon={<LockIcon />} size="small" onClick={() => setEditandoPassword(true)}>
                  Cambiar Contraseña
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            {!editandoPassword ? (
              <Typography variant="body2" color="text.secondary">
                Haz clic en "Cambiar Contraseña" para actualizar tu contraseña.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Contraseña Actual" type={showPassword ? "text" : "password"}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )}} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Nueva Contraseña" type={showNewPassword ? "text" : "password"}
                    value={passwords.newPassword} helperText="Mínimo 6 caracteres"
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )}} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Confirmar Nueva Contraseña" type={showConfirmPassword ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )}} />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" startIcon={<CancelIcon />} disabled={loading}
                      onClick={() => { setEditandoPassword(false); setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}>
                      Cancelar
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={cambiarPassword} disabled={loading}>
                      {loading ? "Cambiando..." : "Cambiar Contraseña"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* ── Personalización ── */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PaletteIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" fontWeight="bold">Personalización</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Tema" value={preferences.theme}
                  onChange={(e) => updatePreferences({ theme: e.target.value })}
                  InputProps={{ startAdornment: <PaletteIcon sx={{ mr: 1, color: "action.active" }} /> }}>
                  <MenuItem value="light">☀️ Claro</MenuItem>
                  <MenuItem value="dark">🌙 Oscuro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Tamaño de Letra" value={preferences.fontSize}
                  onChange={(e) => updatePreferences({ fontSize: e.target.value })}
                  InputProps={{ startAdornment: <TextFieldsIcon sx={{ mr: 1, color: "action.active" }} /> }}>
                  <MenuItem value="small">Pequeño</MenuItem>
                  <MenuItem value="medium">Mediano</MenuItem>
                  <MenuItem value="large">Grande</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Idioma" value={preferences.language}
                  onChange={(e) => updatePreferences({ language: e.target.value })}
                  helperText="Soporte multiidioma próximamente"
                  InputProps={{ startAdornment: <LanguageIcon sx={{ mr: 1, color: "action.active" }} /> }}>
                  <MenuItem value="es">🇪🇸 Español</MenuItem>
                  <MenuItem value="en" disabled>🇺🇸 English (próximamente)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Tipo de Fuente (Aplicación)" value={preferences.fontFamily}
                  onChange={(e) => updatePreferences({ fontFamily: e.target.value })}>
                  <MenuItem value="Roboto">Roboto (Predeterminada)</MenuItem>
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="'Times New Roman'">Times New Roman</MenuItem>
                  <MenuItem value="'Courier New'">Courier New</MenuItem>
                  <MenuItem value="Georgia">Georgia</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Fuente del PDF" value={preferences.pdfFont || "times"}
                  onChange={(e) => updatePreferences({ pdfFont: e.target.value })}
                  helperText="Fuente tipográfica usada al generar el dictamen en PDF"
                  InputProps={{ startAdornment: <PictureAsPdfIcon sx={{ mr: 1, color: "action.active" }} /> }}>
                  <MenuItem value="times">Times New Roman (formal, tradicional)</MenuItem>
                  <MenuItem value="helvetica">Helvetica / Arial (moderna, sans-serif)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box mt={2}>
              <Alert severity="info">Los cambios se aplican inmediatamente y se guardan automáticamente.</Alert>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}
