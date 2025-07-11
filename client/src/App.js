import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Riders from './pages/Riders';
import Rides from './pages/Rides';
import Drivers from './pages/Drivers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
};

// Dispatcher Route Component
const DispatcherRoute = ({ children }) => {
  return <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>{children}</ProtectedRoute>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Dispatcher/Admin Routes */}
        <Route path="riders" element={
          <DispatcherRoute>
            <Riders />
          </DispatcherRoute>
        } />
        <Route path="rides" element={
          <DispatcherRoute>
            <Rides />
          </DispatcherRoute>
        } />
        <Route path="drivers" element={
          <DispatcherRoute>
            <Drivers />
          </DispatcherRoute>
        } />
        <Route path="reports" element={
          <DispatcherRoute>
            <Reports />
          </DispatcherRoute>
        } />
        
        {/* Admin Only Routes */}
        <Route path="settings" element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;