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
