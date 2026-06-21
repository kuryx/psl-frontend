import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewEvaluation from "./pages/NewEvaluation";
import EvaluationsList from "./pages/EvaluationsList";
import EvaluationDetail from "./pages/EvaluationDetail";
import EditEvaluation from "./pages/EditEvaluation";
import AdminUsers from "./pages/AdminUsers";
import AdminAudit from "./pages/AdminAudit";
import VerificarEmail from "./pages/VerificarEmail";
import Planes from "./pages/Planes";
import PagoResultado from "./pages/PagoResultado";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";
import MiCuenta from "./pages/MiCuenta";
import Pacientes from "./pages/Pacientes";
import { ROLES } from "./utils/auth";

function App() {
  return (
    <Routes>
      {/* Rutas públicas (sin Layout) */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verificar-email/:token" element={<VerificarEmail />} />
      <Route path="/pago-resultado" element={<PagoResultado />} />



      {/* Rutas protegidas (con Layout y Sidebar) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/evaluations/new"
        element={
          <ProtectedRoute>
            <Layout>
              <NewEvaluation />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/evaluations/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditEvaluation />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/evaluations"
        element={
          <ProtectedRoute>
            <Layout>
              <EvaluationsList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/evaluations/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EvaluationDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pacientes"
        element={
          <ProtectedRoute>
            <Layout>
              <Pacientes />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cuenta"
        element={
          <ProtectedRoute>
            <Layout>
              <MiCuenta />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Layout>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/auditoria"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Layout>
              <AdminAudit />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/planes"
        element={
          <ProtectedRoute>
            <Layout>
              <Planes />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
