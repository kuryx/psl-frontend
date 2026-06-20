import { useState, useEffect } from "react";
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, MenuItem, TextField,
  Alert, CircularProgress, Switch, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { listarUsuarios, actualizarUsuario, resetPasswordUsuario } from "../services/adminService";
import { ROLES } from "../utils/auth";

const fmtFecha = (f) =>
  new Date(f).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Diálogo de contraseña temporal
  const [resetDialog, setResetDialog] = useState({ open: false, nombre: "", password: "" });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsers(data.users);
    } catch { setError("Error al cargar usuarios"); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, nuevoRol) => {
    setSavingId(userId);
    try {
      await actualizarUsuario(userId, { role: nuevoRol });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: nuevoRol } : u)));
    } catch { setError("Error al actualizar rol"); }
    finally { setSavingId(null); }
  };

  const handleToggleActive = async (userId, isActive) => {
    setSavingId(userId);
    try {
      await actualizarUsuario(userId, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive } : u)));
    } catch { setError("Error al actualizar estado"); }
    finally { setSavingId(null); }
  };

  const handleReset = async (user) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${user.name}? Se generará una contraseña temporal.`)) return;
    setSavingId(user._id);
    try {
      const data = await resetPasswordUsuario(user._id);
      setResetDialog({ open: true, nombre: user.name, password: data.temporalPassword });
    } catch { setError("Error al restablecer contraseña"); }
    finally { setSavingId(null); }
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(resetDialog.password);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Gestión de Usuarios</Typography>
          <Chip label={`${users.length} usuarios`} size="small" sx={{ ml: 1 }} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Cédula</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell align="center">Activo</TableCell>
                  <TableCell>Registro</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover sx={{ opacity: user.isActive ? 1 : 0.5 }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{user.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    </TableCell>
                    <TableCell>{user.cedula}</TableCell>
                    <TableCell>
                      <TextField select size="small" value={user.role}
                        disabled={savingId === user._id}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        sx={{ minWidth: 180 }}>
                        <MenuItem value={ROLES.ADMIN}>{ROLES.ADMIN}</MenuItem>
                        <MenuItem value={ROLES.MEDICO}>{ROLES.MEDICO}</MenuItem>
                        <MenuItem value={ROLES.COORDINADOR}>{ROLES.COORDINADOR}</MenuItem>
                        <MenuItem value={ROLES.PACIENTE}>{ROLES.PACIENTE}</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={!!user.isActive} color="success" size="small"
                        disabled={savingId === user._id}
                        onChange={(e) => handleToggleActive(user._id, e.target.checked)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{fmtFecha(user.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Restablecer contraseña">
                        <span>
                          <IconButton size="small" color="warning"
                            disabled={savingId === user._id}
                            onClick={() => handleReset(user)}>
                            <LockResetIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Diálogo contraseña temporal */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ ...resetDialog, open: false })}>
        <DialogTitle>Contraseña restablecida</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Anota esta contraseña — no se volverá a mostrar. El usuario debe cambiarla desde Mi Cuenta.
          </Alert>
          <Typography variant="body2" mb={1}>
            <strong>Usuario:</strong> {resetDialog.nombre}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}
            sx={{ bgcolor: "grey.100", borderRadius: 1, p: 2, fontFamily: "monospace" }}>
            <Typography variant="h6" fontWeight="bold" flexGrow={1}>
              {resetDialog.password}
            </Typography>
            <Tooltip title={copiado ? "¡Copiado!" : "Copiar"}>
              <IconButton size="small" onClick={handleCopiar}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResetDialog({ ...resetDialog, open: false })}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
