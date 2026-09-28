import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import PropertyValues from './pages/propertyValues/PropertyValues';
import CreateReport from './pages/createReport/CreateReport';
import ReportList from './pages/reportList/ReportList';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/property-values" element={
            <ProtectedRoute>
              <PropertyValues />
            </ProtectedRoute>
          } />
          <Route path="/create-report" element={
            <ProtectedRoute>
              <CreateReport />
            </ProtectedRoute>
          } />
          <Route path="/report-list" element={
            <ProtectedRoute>
              <ReportList />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;