import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // We check the localStorage key set in your Admin.jsx Login function
  const isAuthenticated = localStorage.getItem('isAdminLoggedIn') === 'true';

  if (!isAuthenticated) {
    // If not logged in, redirect to Home (or a dedicated /login page if you make one)
    // Since your Admin.jsx had the login form built-in, this wrapper is 
    // mostly useful if you split the Login page from the Dashboard later.
    // For now, let's redirect to the route that holds the login form.
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;