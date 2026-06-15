import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Container, Typography, Button, Box, Card, CardContent, Grid,
  CircularProgress, Divider, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import PercentIcon from "@mui/icons-material/Percent";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { getCurrentUser, canCreate } from "../utils/auth";
import { obtenerEstadisticas, obtenerAnalitica, obtenerAlertas } from "../services/evaluationService";

const PIE_COLORS = ["#1976d2","#ed6c02","#2e7d32","#9c27b0","#0288d1","#d32f2f","#388e3c","#f57c00"];

const URGENCIA_CONFIG = {
  vencida:  { color: "#d32f2f", bg: "#ffebee", label: "Vencida",   icon: <ErrorIcon fontSize="small" /> },
  critica:  { color: "#b71c1c", bg: "#fff3e0", label: "Crítica",   icon: <ErrorIcon fontSize="small" /> },
  urgente:  { color: "#ed6c02", bg: "#fff8e1", label: "Urgente",   icon: <WarningAmberIcon fontSize="small" /> },
  proxima:  { color: "#1565c0", bg: "#e3f2fd", label: "Próxima",   icon: <AccessTimeIcon fontSize="small" /> },
};

const KPI = ({ icon, label, value, color, sub }) => (
  <Card sx={{ height: "100%", borderLeft: `4px solid ${color}` }}>
    <CardContent sx={{ pb: "12px !important" }}>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
      <Typography variant="h3" fontWeight="bold" sx={{ color, lineHeight: 1 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children, minHeight = 260 }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{title}</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ minHeight }}>{children}</Box>
    </CardContent>
  </Card>
);

const limpiarHTML = (t) => {
  if (!t) return "";
  const d = new DOMParser().parseFromString(t, "text/html");
  return d.body.textContent || "";
};

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState(null);
  const [analitica, setAnalitica] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([obtenerEstadisticas(), obtenerAnalitica(), obtenerAlertas()])
      .then(([s, a, al]) => {
        setStats(s);
        setAnalitica(a);
        setAlertas(al.alertas || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const alertasCriticas = alertas.filter((a) => a.urgencia === "vencida" || a.urgencia === "critica");

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Panel de Control PCL</Typography>
          <Typography variant="body2" color="text.secondary">
            Bienvenido/a, {user?.name} — {user?.role}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {canCreate() && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/evaluations/new")}>
              Nueva Evaluación
            </Button>
          )}
          <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => navigate("/evaluations")}>
            Ver Historial
          </Button>
        </Box>
      </Box>

      {/* ── Alerta crítica banner ── */}
      {!loading && alertasCriticas.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
          <strong>{alertasCriticas.length} evaluación{alertasCriticas.length > 1 ? "es" : ""} con plazo vencido o crítico.</strong>{" "}
          Revisa la sección de alertas a continuación.
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>

          {/* ── KPIs ── */}
          <Grid item xs={6} sm={4} md={2}>
            <KPI icon={<AssessmentIcon />} label="Total" value={stats?.total ?? 0} color="#1976d2" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPI icon={<PendingIcon />} label="Borradores" value={stats?.borradores ?? 0} color="#757575" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPI icon={<AccessTimeIcon />} label="En proceso" value={stats?.enProceso ?? 0} color="#0288d1" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPI icon={<CheckCircleIcon />} label="Ejecutoriados" value={stats?.ejecutoriados ?? 0} color="#2e7d32" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPI
              icon={<WarningAmberIcon />}
              label="Por vencer (≤5d)"
              value={stats?.porVencer ?? 0}
              color={stats?.porVencer > 0 ? "#ed6c02" : "#757575"}
              sub={stats?.vencidas > 0 ? `${stats.vencidas} ya vencida${stats.vencidas > 1 ? "s" : ""}` : null}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPI icon={<PercentIcon />} label="Promedio PCL" value={`${stats?.promedioPCL?.toFixed(1) ?? 0}%`} color="#9c27b0" />
          </Grid>

          {/* ── Panel de alertas ── */}
          {alertas.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <WarningAmberIcon color="warning" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Alertas de plazos — evaluaciones activas
                    </Typography>
                    <Chip label={`${alertas.length}`} size="small" color="warning" />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                          <TableCell>Paciente</TableCell>
                          <TableCell>Dictamen</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell align="center">PCL</TableCell>
                          <TableCell>Límite</TableCell>
                          <TableCell align="center">Días</TableCell>
                          <TableCell align="center">Urgencia</TableCell>
                          <TableCell align="center">Acción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {alertas.slice(0, 10).map((al) => {
                          const cfg = URGENCIA_CONFIG[al.urgencia] || URGENCIA_CONFIG.proxima;
                          return (
                            <TableRow key={al._id} sx={{ bgcolor: cfg.bg }}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">{al.paciente}</Typography>
                                <Typography variant="caption" color="text.secondary">{al.cedula}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{al.numeroDictamen}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{al.estado}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" fontWeight="bold">{al.porcentajePCL}%</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{fmtFecha(al.limite)}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" fontWeight="bold" sx={{ color: cfg.color }}>
                                  {al.diasRestantes < 0
                                    ? `${Math.abs(al.diasRestantes)}d venc.`
                                    : al.diasRestantes === 0 ? "Hoy" : `${al.diasRestantes}d`}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={cfg.label}
                                  size="small"
                                  icon={cfg.icon}
                                  sx={{ bgcolor: cfg.color, color: "white", "& .MuiChip-icon": { color: "white" } }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="outlined"
                                  onClick={() => navigate(`/evaluations/${al._id}`)}>
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {alertas.length > 10 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      Mostrando 10 de {alertas.length}. Ver historial para más.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* ── Distribución PCL ── */}
          <Grid item xs={12} md={7}>
            <ChartCard title="Distribución de PCL (%)">
              {analitica?.pclDistribucion?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analitica.pclDistribucion} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rango" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Evaluaciones" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                  <Typography color="text.secondary">Sin datos suficientes</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* ── Por estado (pie) ── */}
          <Grid item xs={12} md={5}>
            <ChartCard title="Evaluaciones por estado">
              {analitica?.porEstado?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={analitica.porEstado} dataKey="count" nameKey="estado"
                      cx="50%" cy="50%" outerRadius={80}
                      label={({ estado, percent }) => `${estado} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {analitica.porEstado.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={240}>
                  <Typography color="text.secondary">Sin datos suficientes</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* ── Diagnósticos frecuentes ── */}
          <Grid item xs={12} md={8}>
            <ChartCard title="Diagnósticos más frecuentes (top 10)" minHeight={300}>
              {analitica?.diagnosticosFrecuentes?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analitica.diagnosticosFrecuentes.map((d) => ({
                      nombre: `${d._id} — ${limpiarHTML(d.nombre).substring(0, 32)}${limpiarHTML(d.nombre).length > 32 ? "…" : ""}`,
                      count: d.count,
                    }))}
                    layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nombre" width={240} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [v, "Evaluaciones"]} />
                    <Bar dataKey="count" name="Evaluaciones" fill="#0288d1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                  <Typography color="text.secondary">Sin datos suficientes</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* ── PCL por origen ── */}
          <Grid item xs={12} md={4}>
            <ChartCard title="PCL promedio por origen" minHeight={300}>
              {analitica?.pclPorOrigen?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analitica.pclPorOrigen} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="origen" tick={{ fontSize: 10, angle: -20, textAnchor: "end" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, "Promedio PCL"]} />
                    <Bar dataKey="promedio" name="Promedio PCL" fill="#9c27b0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                  <Typography color="text.secondary">Sin datos suficientes</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

          {/* ── Tendencia mensual ── */}
          <Grid item xs={12}>
            <ChartCard title="Tendencia mensual — últimos 12 meses" minHeight={220}>
              {analitica?.tendenciaMensual?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analitica.tendenciaMensual} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Evaluaciones"
                      stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                  <Typography color="text.secondary">Sin datos de los últimos 12 meses</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>

        </Grid>
      )}
    </Container>
  );
}
