import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './auth/AuthContext';
import { AppShell } from './components/AppShell';
import { ClientShell } from './components/ClientShell';
import { LoadingPage } from './components/UI';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { InspirationPage } from './pages/InspirationPage';
import { RegisterPage } from './pages/RegisterPage';
import { SchedulePage } from './pages/SchedulePage';
import { ServicesPage } from './pages/ServicesPage';
import { ClientAppointmentsPage } from './pages/client/ClientAppointmentsPage';
import { ClientBookPage } from './pages/client/ClientBookPage';
import { ClientHomePage } from './pages/client/ClientHomePage';
import { ClientInspirationPage } from './pages/client/ClientInspirationPage';
import { ClientProfilePage } from './pages/client/ClientProfilePage';

function ProtectedApp() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/client" replace />;
  return <AppShell />;
}

function ProtectedClient() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'USER') return <Navigate to="/" replace />;
  return <ClientShell />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="inspiration" element={<InspirationPage />} />
        <Route path="services" element={<ServicesPage />} />
      </Route>
      <Route path="client" element={<ProtectedClient />}>
        <Route index element={<ClientHomePage />} />
        <Route path="book" element={<ClientBookPage />} />
        <Route path="appointments" element={<ClientAppointmentsPage />} />
        <Route path="inspiration" element={<ClientInspirationPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
