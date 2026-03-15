import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DescriptionIcon from "@mui/icons-material/Description";
import { logout, getCurrentUser } from "../utils/auth";
import { obtenerEstadisticas } from "../services/evaluationService";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const data = await obtenerEstadisticas();
      setStats(data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
        {/* Header con info del usuario y botón de logout */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Panel de Control PCL
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bienvenido/a, {user?.name}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </Box>

        {/* Botones de acción principal */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate("/evaluations/new")}
              sx={{ py: 2 }}
            >
              Nueva Evaluación PCL
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate("/evaluations")}
              sx={{ py: 2 }}
            >
              Ver Historial
            </Button>
          </Grid>
        </Grid>

        {/* Estadísticas */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">
                    {stats?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Evaluaciones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Borradores
                  </Typography>
                  <Typography variant="h3" color="warning.main">
                    {stats?.borradores || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Completadas
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {stats?.completadas || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Finalizadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Promedio PCL
                  </Typography>
                  <Typography variant="h3" color="info.main">
                    {stats?.promedioPCL?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    General
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Información del usuario */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información del usuario
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Nombre:</strong> {user?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Cédula:</strong> {user?.cedula}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Rol:</strong> {user?.role}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}