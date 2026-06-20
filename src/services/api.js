import axios from "axios";

// Crear instancia de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
});

// ============================================
// INTERCEPTOR PARA AGREGAR TOKEN
// ============================================
// Este interceptor se ejecuta antes de cada peticiÃ³n
// y agrega automÃ¡ticamente el token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTOR PARA MANEJAR ERRORES
// ============================================
// Este interceptor se ejecuta cuando recibimos una respuesta
// Si el token expirÃ³ (401 o 403), cerramos sesiÃ³n automÃ¡ticamente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token invÃ¡lido o expirado
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirigir al login
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

