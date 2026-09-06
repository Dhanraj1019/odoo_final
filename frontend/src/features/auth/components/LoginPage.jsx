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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-5 sm:p-7 transition-all">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-2">
          <Lock className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-xs text-slate-500 mt-0.5 font-normal">
          Sign in to access your HR & Payroll workspace
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
