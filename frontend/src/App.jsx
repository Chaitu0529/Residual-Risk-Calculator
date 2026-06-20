import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import RiskList   from './pages/RiskList';
import RiskDetail from './pages/RiskDetail';
import CreateRisk from './pages/CreateRisk';
import EditRisk   from './pages/EditRisk';
import Analytics  from './pages/Analytics';
import AuditLog   from './pages/AuditLog';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all authenticated users */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/risks"
          element={
            <ProtectedRoute>
              <Layout>
                <RiskList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/risks/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <RiskDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected — Admin only */}
        <Route
          path="/risks/new"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <CreateRisk />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/risks/:id/edit"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <EditRisk />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute requireAdmin>
              <Layout>
                <AuditLog />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
