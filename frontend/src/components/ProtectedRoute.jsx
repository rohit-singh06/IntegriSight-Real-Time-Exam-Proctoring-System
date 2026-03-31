// ProtectedRoute.jsx
// simple wrapper to redirect unauthenticated or wrong-role users

import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ role, children }) {
  const uStr = localStorage.getItem('integrisight_user');
  
  if (!uStr) {
    return <Navigate to="/login" replace />;
  }
  
  let user;
  try {
    user = JSON.parse(uStr);
  } catch (err) {
    // sometimes old invalid data gets stuck in localStorage
    return <Navigate to="/login" replace />;
  }
  
  // bounce them to their own dashboard if they try to access the wrong one
  if (user.role !== role) {
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user.role === 'proctor') {
      return <Navigate to="/proctor/dashboard" replace />;
    }
  }
  
  return children;
}

export default ProtectedRoute;
