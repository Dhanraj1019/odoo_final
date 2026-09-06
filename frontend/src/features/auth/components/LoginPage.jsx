import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser, selectIsAuthenticated } from "../authSlice";
import LoginForm from "./LoginForm";
import { Lock } from "lucide-react";

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
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/90 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 shadow-2xs">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-xs text-slate-500 mt-1 font-normal">
          Sign in to access your HR & Payroll workspace
        </p>
      </div>

      <LoginForm />
    </div>
  );
}

