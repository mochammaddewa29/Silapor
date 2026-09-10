import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportFormPage from './pages/ReportFormPage';
import ReportHistoryPage from './pages/ReportHistoryPage';
import AdminReportsPage from './pages/AdminReportsPage';

export const App = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside Layout */}
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
        <Route path="lapor" element={<ReportFormPage />} />
        <Route path="riwayat" element={<ReportHistoryPage />} />
        
        {/* Admin Only Route */}
        <Route
          path="admin/laporan"
          element={
            <ProtectedRoute adminOnly>
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </ErrorBoundary>
  );
};

export default App;
