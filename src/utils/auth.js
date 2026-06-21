export const ROLES = {
  ADMIN: "Administrador",
  MEDICO: "Médico Calificador",
  COORDINADOR: "Coordinador",
  PACIENTE: "Paciente",
};

export const login = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const hasRole = (role) => {
  const user = getCurrentUser();
  return user?.role === role;
};

export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return roles.includes(user?.role);
};

export const isAdmin = () => hasRole(ROLES.ADMIN);
export const isMedico = () => hasRole(ROLES.MEDICO);
export const isCoordinador = () => hasRole(ROLES.COORDINADOR);
export const isPaciente = () => hasRole(ROLES.PACIENTE);

export const canCreate = () => hasAnyRole([ROLES.ADMIN, ROLES.MEDICO]);
export const canEdit = () => hasAnyRole([ROLES.ADMIN, ROLES.MEDICO]);
export const canDelete = () => hasAnyRole([ROLES.ADMIN, ROLES.MEDICO]);
export const canManageWorkflow = () => hasAnyRole([ROLES.ADMIN, ROLES.COORDINADOR, ROLES.MEDICO]);

// ── Plan / suscripción ──────────────────────────────────────────────
export const PLANES = { FREE: "free", PROFESIONAL: "profesional", EMPRESARIAL: "empresarial" };

export const LIMITES_PLAN = {
  free:        { evaluacionesMes: 5,  ia: false },
  profesional: { evaluacionesMes: null, ia: true },
  empresarial: { evaluacionesMes: null, ia: true },
};

export const getPlan = () => getCurrentUser()?.plan || "free";
export const isPlanActivo = () => {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.plan === "free") return true;
  if (!user.planVence) return true;
  return new Date() < new Date(user.planVence);
};
export const puedeUsarIA = () => {
  if (isAdmin()) return true;
  const plan = getPlan();
  return LIMITES_PLAN[plan]?.ia === true && isPlanActivo();
};
export const evaluacionesMesRestantes = () => {
  if (isAdmin()) return null;
  const user = getCurrentUser();
  const plan = getPlan();
  const limite = LIMITES_PLAN[plan]?.evaluacionesMes;
  if (limite === null) return null;
  return Math.max(0, limite - (user?.evaluacionesMes || 0));
};
