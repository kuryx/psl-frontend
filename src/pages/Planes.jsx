import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Typography, Box, Card, CardContent, Button, Chip,
  List, ListItem, ListItemIcon, ListItemText, Alert, CircularProgress, Divider,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import api from "../services/api";
import { getCurrentUser, getPlan } from "../utils/auth";

const PLANES = [
  {
    id: "free",
    nombre: "Gratuito",
    precio: 0,
    color: "default",
    icon: null,
    descripcion: "Para probar el sistema",
    features: [
      { texto: "3 evaluaciones por mes",           incluido: true  },
      { texto: "PDF del dictamen",                incluido: true  },
      { texto: "Historial de evaluaciones",       incluido: true  },
      { texto: "Análisis con IA",                 incluido: false },
      { texto: "Extracción PDF con IA",           incluido: false },
      { texto: "Soporte prioritario",             incluido: false },
    ],
  },
  {
    id: "profesional",
    nombre: "Profesional",
    precio: 89900,
    color: "primary",
    icon: <WorkspacePremiumIcon />,
    badge: "Más popular",
    descripcion: "Para médicos y peritos independientes",
    features: [
      { texto: "Evaluaciones ilimitadas",         incluido: true  },
      { texto: "PDF del dictamen",                incluido: true  },
      { texto: "Historial de evaluaciones",       incluido: true  },
      { texto: "Análisis con IA incluida",        incluido: true  },
      { texto: "Extracción PDF con IA",           incluido: true  },
      { texto: "Soporte prioritario por email",   incluido: true  },
    ],
  },
  {
    id: "empresarial",
    nombre: "Empresarial",
    precio: 269900,
    color: "warning",
    icon: <StarIcon />,
    descripcion: "Para clínicas, ARL e IPS",
    features: [
      { texto: "Evaluaciones ilimitadas",         incluido: true  },
      { texto: "PDF del dictamen",                incluido: true  },
      { texto: "Historial de evaluaciones",       incluido: true  },
      { texto: "Análisis con IA incluida",        incluido: true  },
      { texto: "Extracción PDF con IA",           incluido: true  },
      { texto: "Múltiples usuarios",              incluido: true  },
      { texto: "Soporte prioritario",             incluido: true  },
    ],
  },
];

const fmtCOP = (n) =>
  n === 0 ? "Gratis" : `$${n.toLocaleString("es-CO")}/mes`;

export default function Planes() {
  const navigate = useNavigate();
  const planActual = getPlan();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const handleSuscribir = async (planId) => {
    if (planId === "free" || planId === planActual) return;
    setLoading(planId);
    setError("");
    try {
      const { data } = await api.post("/pagos/crear-referencia", { plan: planId });

      if (!data.publicKey) {
        setError("El sistema de pagos aún no está configurado. Contacta al administrador.");
        setLoading(null);
        return;
      }

      // Cargar widget de Wompi dinámicamente
      if (!document.getElementById("wompi-script")) {
        const script = document.createElement("script");
        script.id = "wompi-script";
        script.src = "https://checkout.wompi.co/widget.js";
        script.setAttribute("data-render", "button");
        document.body.appendChild(script);
      }

      // Crear formulario Wompi
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "https://checkout.wompi.co/p/";
      const campos = {
        "public-key":             data.publicKey,
        "currency":               data.moneda,
        "amount-in-cents":        String(data.centavos),
        "reference":              data.referencia,
        "signature:integrity":    data.firma,
        "redirect-url":           `${window.location.origin}/pago-resultado`,
      };
      Object.entries(campos).forEach(([k, v]) => {
        const inp = document.createElement("input");
        inp.type = "hidden"; inp.name = k; inp.value = v;
        form.appendChild(inp);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err.response?.data?.message || "Error iniciando el pago. Intenta de nuevo.");
      setLoading(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box textAlign="center" mb={5}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Elige tu plan
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acepta PSE, Nequi, tarjetas débito y crédito · Cancela cuando quieras
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

      <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
        {PLANES.map((plan) => {
          const esActual = plan.id === planActual;
          const esPremium = plan.id !== "free";
          return (
            <Card
              key={plan.id}
              elevation={plan.badge ? 6 : 2}
              sx={{
                width: 300,
                border: plan.badge ? "2px solid" : "1px solid",
                borderColor: plan.badge ? "primary.main" : "divider",
                borderRadius: 3,
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.badge && (
                <Chip
                  label={plan.badge}
                  color="primary"
                  size="small"
                  sx={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontWeight: "bold" }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, pt: plan.badge ? 3 : 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {plan.icon}
                  <Typography variant="h6" fontWeight="bold">{plan.nombre}</Typography>
                  {esActual && <Chip label="Tu plan" size="small" color="success" />}
                </Box>

                <Typography variant="h4" fontWeight="bold" color={esPremium ? "primary.main" : "text.secondary"} mb={0.5}>
                  {fmtCOP(plan.precio)}
                </Typography>
                <Typography variant="caption" color="text.secondary">{plan.descripcion}</Typography>

                <Divider sx={{ my: 2 }} />

                <List dense disablePadding>
                  {plan.features.map((f, i) => (
                    <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {f.incluido
                          ? <CheckIcon fontSize="small" color="success" />
                          : <CloseIcon fontSize="small" color="disabled" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={f.texto}
                        primaryTypographyProps={{ variant: "body2", color: f.incluido ? "text.primary" : "text.disabled" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <Box p={2} pt={0}>
                <Button
                  fullWidth
                  variant={plan.badge ? "contained" : "outlined"}
                  color={plan.id === "empresarial" ? "warning" : "primary"}
                  disabled={esActual || plan.id === "free" || loading === plan.id}
                  onClick={() => handleSuscribir(plan.id)}
                  startIcon={loading === plan.id ? <CircularProgress size={16} /> : null}
                >
                  {esActual ? "Plan actual" : plan.id === "free" ? "Gratis" : "Suscribirse"}
                </Button>
              </Box>
            </Card>
          );
        })}
      </Box>

      <Box textAlign="center" mt={4}>
        <Typography variant="caption" color="text.secondary">
          Pagos procesados de forma segura por Wompi · Bancolombia Group
        </Typography>
      </Box>

      <Box textAlign="center" mt={1}>
        <Button variant="text" size="small" onClick={() => navigate(-1)}>← Volver</Button>
      </Box>
    </Container>
  );
}
