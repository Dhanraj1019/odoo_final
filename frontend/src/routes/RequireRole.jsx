import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectCurrentUser } from "../features/auth/authSlice";

export default function RequireRole({ allowedRoles = [], children }) {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : [];
  const isAuthorized = userRoles.some((role) => allowedRoles.includes(role));

  if (!isAuthorized) {
    // If Employee, redirect to Employee portal, otherwise default dashboard
    if (userRoles.includes("Employee")) {
      return <Navigate to="/me" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
