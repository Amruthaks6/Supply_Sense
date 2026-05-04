import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // In a real application, you would decode the JWT token from localStorage to get the role
  // For this implementation, we simulate checking local/session storage for the role and token
  
  const token = localStorage.getItem('supply_sense_token');
  const role = localStorage.getItem('supply_sense_role');
  const anonId = sessionStorage.getItem('supply_sense_anon_id');

  // Check if it's an anonymous donor
  const isAnonymous = !!anonId;

  // If no standard token and no anonymous session exists, user is unauthorized
  if (!token && !isAnonymous) {
    return <Navigate to="/login" replace />;
  }

  // If user is anonymous, they automatically assume the 'Donor' role
  const userRole = isAnonymous ? 'Donor' : role;

  // Check if the user's role is allowed to access this route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on their actual role
    if (userRole === 'NGO') {
      return <Navigate to="/ngo-dashboard" replace />;
    } else {
      return <Navigate to="/donor-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
