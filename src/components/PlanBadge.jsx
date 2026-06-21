import { Box, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import { getPlan, evaluacionesMesRestantes, LIMITES_PLAN, isPlanActivo } from "../utils/auth";

const COLOR = {
  free:        { bg: "#f0f0f0", text: "#666",    border: "#ccc"    },
  profesional: { bg: "#e8f4fd", text: "#1565c0", border: "#1565c0" },
  empresarial: { bg: "#fdf6e3", text: "#b8860b", border: "#b8860b" },
};

const LABEL = {
  free:        "Plan Gratuito",
  profesional: "Profesional",
  empresarial: "Empresarial",
};

export default function PlanBadge({ collapsed = false }) {
  const plan = getPlan();
  const activo = isPlanActivo();
  const restantes = evaluacionesMesRestantes();
  const limite = LIMITES_PLAN[plan]?.evaluacionesMes;
  const usadas = limite !== null ? (limite - (restantes ?? 0)) : 0;
  const c = COLOR[plan] || COLOR.free;

  const badge = (
    <Box
      sx={{
        mx: collapsed ? "auto" : 1.5,
        my: 1,
        p: collapsed ? 0.5 : 1.5,
        borderRadius: 2,
        border: `1px solid ${c.border}`,
        bgcolor: c.bg,
        textAlign: "center",
        minWidth: collapsed ? 36 : "auto",
      }}
    >
      {plan === "free"
        ? <WorkspacePremiumIcon sx={{ fontSize: 20, color: c.text }} />
        : <StarIcon sx={{ fontSize: 20, color: c.text }} />
      }

      {!collapsed && (
        <>
          <Typography variant="caption" display="block" fontWeight="bold" color={c.text} mt={0.3}>
            {LABEL[plan]}{!activo ? " (vencido)" : ""}
          </Typography>

          {limite !== null && (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (usadas / limite) * 100)}
                sx={{ mt: 1, mb: 0.5, height: 5, borderRadius: 3,
                  bgcolor: "#ddd",
                  "& .MuiLinearProgress-bar": { bgcolor: usadas >= limite ? "#e53935" : c.text },
                }}
              />
              <Typography variant="caption" color={c.text}>
                {restantes === 0
                  ? "Límite mensual alcanzado"
                  : `${restantes} eval. restantes este mes`}
              </Typography>
            </>
          )}

          {limite === null && (
            <Typography variant="caption" color={c.text} display="block" mt={0.3}>
              Evaluaciones ilimitadas
            </Typography>
          )}
        </>
      )}
    </Box>
  );

  if (collapsed) {
    return (
      <Tooltip title={`${LABEL[plan]}${limite !== null ? ` · ${restantes} restantes` : " · Ilimitado"}`} placement="right">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
