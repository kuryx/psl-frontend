import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewEvaluation from "./pages/NewEvaluation";
import EvaluationsList from "./pages/EvaluationsList";
import EvaluationDetail from "./pages/EvaluationDetail";
import EditEvaluation from "./pages/EditEvaluation";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluations/new"
          element={
            <ProtectedRoute>
              <NewEvaluation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluations/:id/edit"
          element={
            <ProtectedRoute>
              <EditEvaluation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluations"
          element={
            <ProtectedRoute>
              <EvaluationsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluations/:id"
          element={
            <ProtectedRoute>
              <EvaluationDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
