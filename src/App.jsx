import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';
import AssignedTasks from './pages/AssignedTasks';
import ProjectPortfolio from './pages/ProjectPortfolio';
import ActivityLogs from './pages/ActivityLogs';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Route Guard (prevents logged in users from seeing login/signup)
function PublicRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

// Manager/Admin Route Guard
function ManagerRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUser = useSelector((state) => state.auth.user);
  const isManagerOrAdmin = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isManagerOrAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />

        {/* Protected workspace routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/project/:projectId" 
          element={
            <ProtectedRoute>
              <ProjectBoard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-tasks" 
          element={
            <ProtectedRoute>
              <AssignedTasks />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/portfolio" 
          element={
            <ManagerRoute>
              <ProjectPortfolio />
            </ManagerRoute>
          } 
        />
        <Route 
          path="/activity-logs" 
          element={
            <ManagerRoute>
              <ActivityLogs />
            </ManagerRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
