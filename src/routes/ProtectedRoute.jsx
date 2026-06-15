import { Navigate } from "react-router-dom";
import { isAuthenticated, hasAnyRole } from "../utils/auth";

export default function ProtectedRoute({ children, roles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  if (roles && !hasAnyRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
