import { useState } from "react";
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
  IconButton,
  Collapse,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const DRAWER_WIDTH = 280;

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [evaluacionesOpen, setEvaluacionesOpen] = useState(true);

  // Obtener usuario del localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Evaluaciones PCL",
      icon: <AssignmentIcon />,
      submenu: [
        {
          text: "Nueva Evaluación",
          icon: <AddCircleOutlineIcon />,
          path: "/evaluations/new",
        },
        {
          text: "Historial",
          icon: <ListAltIcon />,
          path: "/evaluations",
        },
      ],
    },
    {
      text: "Mi Cuenta",
      icon: <AccountCircleIcon />,
      path: "/cuenta",
    },
  ];

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
        <Typography variant="h6" fontWeight="bold">
          Sistema PCL
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Gestión de Evaluaciones
        </Typography>
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
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email || "email@example.com"}
            </Typography>
          </Box>
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