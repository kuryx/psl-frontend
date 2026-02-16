// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Guardar sesión del usuario
 */
export const login = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Cerrar sesión del usuario
 */
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token; // Retorna true si existe token, false si no
};

/**
 * Obtener el token actual
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Obtener datos del usuario actual
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error al parsear usuario:", error);
    return null;
  }
};

/**
 * Verificar si el usuario tiene un rol específico
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

/**
 * Verificar si el usuario es administrador
 */
export const isAdmin = () => {
  return hasRole("Administrador");
};

/**
 * Verificar si el usuario es médico
 */
export const isMedico = () => {
  return hasRole("Médico evaluador");
};