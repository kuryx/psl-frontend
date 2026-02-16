import axios from "axios";

// Crear instancia de axios
const api = axios.create({
  baseURL: "http://localhost:4000"
});

// ============================================
// INTERCEPTOR PARA AGREGAR TOKEN
// ============================================
// Este interceptor se ejecuta antes de cada petición
// y agrega automáticamente el token JWT si existe
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
// Si el token expiró (401 o 403), cerramos sesión automáticamente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token inválido o expirado
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