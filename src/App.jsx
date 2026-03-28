import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewEvaluation from "./pages/NewEvaluation";
import EvaluationsList from "./pages/EvaluationsList";
import EvaluationDetail from "./pages/EvaluationDetail";
import EditEvaluation from "./pages/EditEvaluation";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/Layout";
import MiCuenta from "./pages/MiCuenta";

function App() {
  return (
    <Routes>
      {/* Rutas públicas (sin Layout) */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
        path="/cuenta"
        element={
          <ProtectedRoute>
            <Layout>
              <MiCuenta />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
