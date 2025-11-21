import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BlocksPage } from './pages/blocks/BlocksPage';
import { BellsPage } from './pages/bells/BellsPage';
import { SchedulesPage } from './pages/schedules/SchedulesPage';
import { EmergencyPage } from './pages/emergency/EmergencyPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { useIsAuthenticated } from './state/useAuthStore';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBlocksPage } from './pages/admin/AdminBlocksPage';
import { AdminBellsPage } from './pages/admin/AdminBellsPage';
import { AdminSchedulesPage } from './pages/admin/AdminSchedulesPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';
import { AdminOrganisationsPage } from './pages/admin/AdminOrganisationsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { useAuthStore } from './state/useAuthStore';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }: { children: ReactElement }) => {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="blocks" element={<BlocksPage />} />
        <Route path="bells" element={<BellsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="emergency" element={<EmergencyPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="organisations" element={<AdminOrganisationsPage />} />
        <Route path="blocks" element={<AdminBlocksPage />} />
        <Route path="bells" element={<AdminBellsPage />} />
        <Route path="schedules" element={<AdminSchedulesPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
