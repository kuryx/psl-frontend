import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

/**
 * Componente para proteger rutas
 * Solo permite acceso si el usuario está autenticado
 */
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    // Si no está autenticado, redirige al login
    return <Navigate to="/" replace />;
  }

  // Si está autenticado, muestra el componente hijo
  return children;
}