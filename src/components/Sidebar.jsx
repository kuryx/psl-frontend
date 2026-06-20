import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Avatar,
  Collapse,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import ContactsIcon from "@mui/icons-material/Contacts";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { canCreate, isAdmin } from "../utils/auth";
import { usePreferences } from "../contexts/PreferencesContext";
import { obtenerAlertas } from "../services/evaluationService";

const DRAWER_WIDTH = 280;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [evaluacionesOpen, setEvaluacionesOpen] = useState(true);
  const [alertasCount, setAlertasCount] = useState(0);
  const { preferences, updatePreferences } = usePreferences();
  const isDark = preferences.theme === "dark";

  // Obtener usuario del localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Cargar conteo de alertas urgentes al montar y cada 5 minutos
  useEffect(() => {
    const cargarAlertas = () => {
      obtenerAlertas()
        .then(({ alertas }) => {
          const urgentes = alertas.filter(
            (a) => a.urgencia === "vencida" || a.urgencia === "critica" || a.urgencia === "urgente"
          ).length;
          setAlertasCount(urgentes);
        })
        .catch(() => {});
    };
    cargarAlertas();
    const intervalo = setInterval(cargarAlertas, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const evaluacionesSubmenu = [
    ...(canCreate()
      ? [{ text: "Nueva Evaluación", icon: <AddCircleOutlineIcon />, path: "/evaluations/new" }]
      : []),
    {
      text: "Historial",
      icon: (
        <Badge badgeContent={alertasCount || null} color="error" max={99}>
          <ListAltIcon />
        </Badge>
      ),
      path: "/evaluations",
    },
    { text: "Pacientes", icon: <ContactsIcon />, path: "/pacientes" },
  ];

  const menuItems = [
    {
      text: "Dashboard",
      icon: (
        <Badge badgeContent={alertasCount || null} color="error" max={99}>
          <DashboardIcon />
        </Badge>
      ),
      path: "/dashboard",
    },
    { text: "Evaluaciones PCL", icon: <AssignmentIcon />, submenu: evaluacionesSubmenu },
    { text: "Mi Cuenta", icon: <AccountCircleIcon />, path: "/cuenta" },
    ...(isAdmin()
      ? [
          { text: "Gestión de Usuarios", icon: <PeopleIcon />, path: "/admin/usuarios" },
          { text: "Log de Auditoría",    icon: <HistoryIcon />, path: "/admin/auditoria" },
        ]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          component="img"
          src="/logo-md.jpeg"
          alt="Logo"
          sx={{ width: "100%", maxWidth: 220, height: "auto", objectFit: "contain" }}
        />
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) =>
          item.submenu ? (
            // Item con submenu
            <Box key={item.text}>
              <ListItemButton
                onClick={() => setEvaluacionesOpen(!evaluacionesOpen)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ color: "primary.main" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {evaluacionesOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={evaluacionesOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subitem) => (
                    <ListItemButton
                      key={subitem.text}
                      onClick={() => navigate(subitem.path)}
                      selected={isActive(subitem.path)}
                      sx={{
                        pl: 4,
                        mx: 1,
                        borderRadius: 2,
                        mb: 0.5,
                        "&.Mui-selected": {
                          bgcolor: "primary.light",
                          color: "primary.main",
                          "&:hover": {
                            bgcolor: "primary.light",
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive(subitem.path)
                            ? "primary.main"
                            : "inherit",
                          minWidth: 40,
                        }}
                      >
                        {subitem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subitem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          ) : (
            // Item simple
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    bgcolor: "primary.light",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.light",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? "primary.main" : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>

      <Divider />

      {/* User Info & Logout */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
            {user.name?.charAt(0).toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="bold" noWrap>
              {user.name || "Usuario"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user.role || ""}
            </Typography>
          </Box>
          <Tooltip title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
            <IconButton
              size="small"
              onClick={() => updatePreferences({ theme: isDark ? "light" : "dark" })}
              sx={{ color: isDark ? "warning.light" : "text.secondary" }}
            >
              {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "error.main",
            "&:hover": {
              bgcolor: "error.light",
            },
          }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export { DRAWER_WIDTH };