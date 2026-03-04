import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import WebhooksPage from "./pages/WebhooksPage";
import EventsPage from "./pages/EventsPage";
import MetricsPage from "./pages/MetricsPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/metrics" replace />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="webhooks" element={<WebhooksPage />} />
          <Route path="events" element={<EventsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
