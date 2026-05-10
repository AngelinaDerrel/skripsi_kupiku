import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const raw = localStorage.getItem('kupiku_user');
  if (!raw) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(raw);
    if (role) {
      if (Array.isArray(role)) {
        if (!role.includes(user?.role)) return <Navigate to="/mood" replace />;
      } else {
        if (user?.role !== role) return <Navigate to="/mood" replace />;
      }
    }
  } catch {
    localStorage.removeItem('kupiku_user');
    return <Navigate to="/login" replace />;
  }

  return children;
}
