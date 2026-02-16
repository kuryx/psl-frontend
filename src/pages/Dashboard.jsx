import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout, getCurrentUser } from "../utils/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

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

        {/* Información del usuario */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información del usuario
            </Typography>
            <Typography variant="body1">
              <strong>Nombre:</strong> {user?.name}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {user?.email}
            </Typography>
            <Typography variant="body1">
              <strong>Cédula:</strong> {user?.cedula}
            </Typography>
            <Typography variant="body1">
              <strong>Rol:</strong> {user?.role}
            </Typography>
          </CardContent>
        </Card>

        {/* Placeholder para futuras funcionalidades */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Próximas funcionalidades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Crear evaluación PCL<br />
              • Ver historial de evaluaciones<br />
              • Generar certificados PDF<br />
              • Panel administrativo (según rol)
            </Typography>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}