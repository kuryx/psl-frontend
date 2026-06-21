import { useState, useEffect } from "react";
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, MenuItem, TextField,
  Alert, CircularProgress, Switch, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import {
  listarUsuarios, actualizarUsuario, resetPasswordUsuario, cambiarPlanUsuario,
} from "../services/adminService";
import { ROLES } from "../utils/auth";

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" }) : "—";

const PLAN_META = {
  free:        { label: "Gratuito",     color: "default", icon: null },
  profesional: { label: "Profesional",  color: "primary", icon: <WorkspacePremiumIcon sx={{ fontSize: 14 }} /> },
  empresarial: { label: "Empresarial",  color: "warning", icon: <StarIcon sx={{ fontSize: 14 }} /> },
};

const PLAN_OPCIONES = ["free", "profesional", "empresarial"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [resetDialog, setResetDialog] = useState({ open: false, nombre: "", password: "" });
  const [copiado, setCopiado] = useState(false);

  const [planDialog, setPlanDialog] = useState({ open: false, user: null, plan: "free", dias: 30 });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsers(data.users);
    } catch { setError("Error al cargar usuarios"); }
    finally { setLoading(false); }
  };

  const notificar = (msg, tipo = "success") => {
    if (tipo === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  };

  const handleRoleChange = async (userId, nuevoRol) => {
    setSavingId(userId);
    try {
      await actualizarUsuario(userId, { role: nuevoRol });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: nuevoRol } : u)));
    } catch { notificar("Error al actualizar rol", "error"); }
    finally { setSavingId(null); }
  };

  const handleToggleActive = async (userId, isActive) => {
    setSavingId(userId);
    try {
      await actualizarUsuario(userId, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive } : u)));
    } catch { notificar("Error al actualizar estado", "error"); }
    finally { setSavingId(null); }
  };

  const handleReset = async (user) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${user.name}?`)) return;
    setSavingId(user._id);
    try {
      const data = await resetPasswordUsuario(user._id);
      setResetDialog({ open: true, nombre: user.name, password: data.temporalPassword });
    } catch { notificar("Error al restablecer contraseña", "error"); }
    finally { setSavingId(null); }
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(resetDialog.password);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const abrirPlanDialog = (user) => {
    setPlanDialog({ open: true, user, plan: user.plan || "free", dias: 30 });
  };

  const handleCambiarPlan = async () => {
    const { user, plan, dias } = planDialog;
    setSavingId(user._id);
    try {
      const diasVigencia = plan === "free" ? 0 : Number(dias);
      const data = await cambiarPlanUsuario(user._id, plan, diasVigencia);
      setUsers((prev) => prev.map((u) =>
        u._id === user._id ? { ...u, plan: data.user.plan, planVence: data.user.planVence, evaluacionesMes: 0 } : u
      ));
      notificar(`Plan de ${user.name} actualizado a ${plan}`);
      setPlanDialog({ ...planDialog, open: false });
    } catch { notificar("Error al cambiar plan", "error"); }
    finally { setSavingId(null); }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <PeopleIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Gestión de Usuarios</Typography>
          <Chip label={`${users.length} usuarios`} size="small" sx={{ ml: 1 }} />
        </Box>

        {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Cédula</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell align="center">Plan</TableCell>
                  <TableCell align="center">Eval./mes</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell align="center">Activo</TableCell>
                  <TableCell>Registro</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const meta = PLAN_META[user.plan || "free"] || PLAN_META.free;
                  const vencido = user.planVence && new Date() > new Date(user.planVence);
                  return (
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
                          sx={{ minWidth: 170 }}>
                          {Object.values(ROLES).map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </TextField>
                      </TableCell>

                      {/* ── Plan ── */}
                      <TableCell align="center">
                        <Tooltip title="Cambiar plan">
                          <Chip
                            size="small"
                            label={meta.label}
                            color={vencido ? "error" : meta.color}
                            icon={meta.icon}
                            onClick={() => abrirPlanDialog(user)}
                            sx={{ cursor: "pointer", fontWeight: "bold" }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* ── Evaluaciones del mes ── */}
                      <TableCell align="center">
                        <Typography variant="caption">
                          {user.evaluacionesMes ?? 0}
                          {user.plan === "free" ? " / 5" : ""}
                        </Typography>
                      </TableCell>

                      {/* ── Fecha vencimiento ── */}
                      <TableCell>
                        <Typography variant="caption" color={vencido ? "error" : "text.secondary"}>
                          {user.plan === "free" ? "—" : fmtFecha(user.planVence)}
                        </Typography>
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Diálogo contraseña temporal ── */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ ...resetDialog, open: false })}>
        <DialogTitle>Contraseña restablecida</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Anota esta contraseña — no se volverá a mostrar.
          </Alert>
          <Typography variant="body2" mb={1}><strong>Usuario:</strong> {resetDialog.nombre}</Typography>
          <Box display="flex" alignItems="center" gap={1}
            sx={{ bgcolor: "grey.100", borderRadius: 1, p: 2, fontFamily: "monospace" }}>
            <Typography variant="h6" fontWeight="bold" flexGrow={1}>{resetDialog.password}</Typography>
            <Tooltip title={copiado ? "¡Copiado!" : "Copiar"}>
              <IconButton size="small" onClick={handleCopiar}><ContentCopyIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResetDialog({ ...resetDialog, open: false })}>Entendido</Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo cambiar plan ── */}
      <Dialog open={planDialog.open} onClose={() => setPlanDialog({ ...planDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar Plan — {planDialog.user?.name}</DialogTitle>
        <DialogContent>
          <Divider sx={{ mb: 2 }} />
          <TextField
            select fullWidth label="Plan" size="small" sx={{ mb: 2 }}
            value={planDialog.plan}
            onChange={(e) => setPlanDialog({ ...planDialog, plan: e.target.value })}
          >
            <MenuItem value="free">Gratuito (5 eval/mes, sin IA)</MenuItem>
            <MenuItem value="profesional">Profesional (ilimitado + IA)</MenuItem>
            <MenuItem value="empresarial">Empresarial (ilimitado + IA + multi-usuario)</MenuItem>
          </TextField>

          {planDialog.plan !== "free" && (
            <TextField
              fullWidth label="Días de vigencia" type="number" size="small"
              helperText="0 = sin vencimiento"
              value={planDialog.dias}
              onChange={(e) => setPlanDialog({ ...planDialog, dias: e.target.value })}
              inputProps={{ min: 0 }}
            />
          )}

          {planDialog.plan === "free" && (
            <Alert severity="info" sx={{ mt: 1 }}>
              El plan gratuito limita a 5 evaluaciones por mes y no incluye IA.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialog({ ...planDialog, open: false })}>Cancelar</Button>
          <Button variant="contained" onClick={handleCambiarPlan}
            disabled={savingId === planDialog.user?._id}>
            Aplicar Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
