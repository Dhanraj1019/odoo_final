import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser, selectIsAuthenticated } from "../authSlice";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const roles = Array.isArray(user.roles) ? user.roles : [];
      if (roles.includes("Employee") && roles.length === 1) {
        navigate("/me", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your organization credentials to access the workspace
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
