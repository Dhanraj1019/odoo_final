import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials, setAuthError } from "../authSlice";
import { apiFetch } from "../../../lib/apiClient";
import { addNotification } from "../../notifications/notificationSlice";
import Spinner from "../../../components/common/Spinner";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, Briefcase, Calculator, User } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    title: "Admin",
    email: "admin@peoplepay360.local",
    password: "AdminPassword2026!",
    icon: ShieldCheck,
    color: "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700",
  },
  {
    role: "HR Manager",
    title: "HR Mgr",
    email: "hrmanager@peoplepay360.local",
    password: "HRManager2026!",
    icon: Briefcase,
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700",
  },
  {
    role: "HR Payroll Manager",
    title: "Payroll Mgr",
    email: "payrollmanager@peoplepay360.local",
    password: "PayrollMgr2026!",
    icon: Calculator,
    color: "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700",
  },
  {
    role: "HR Payroll User",
    title: "Payroll User",
    email: "payrolluser@peoplepay360.local",
    password: "PayrollUser2026!",
    icon: UserCheck,
    color: "border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700",
  },
  {
    role: "Employee",
    title: "Employee",
    email: "employee@peoplepay360.local",
    password: "Employee2026!",
    icon: User,
    color: "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700",
  },
];

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
        }),
      });

      if (res?.data?.user) {
        const user = res.data.user;
        dispatch(setCredentials(user));
        dispatch(
          addNotification({
            type: "success",
            message: `Welcome back, ${user.fullName}!`,
          })
        );

        const roles = Array.isArray(user.roles) ? user.roles : [];
        if (roles.includes("Employee") && roles.length === 1) {
          navigate("/me");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      const msg = err.message || "Invalid email or password";
      setServerError(msg);
      dispatch(setAuthError(msg));
      dispatch(
        addNotification({
          type: "error",
          message: msg,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (account) => {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    setServerError("");
  };

  return (
    <div className="space-y-6">
      {serverError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              placeholder="name@company.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address format",
                },
              })}
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all text-slate-900 focus:outline-hidden focus:ring-2 ${
                errors.email
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              {...register("password", {
                required: "Password is required",
              })}
              className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all text-slate-900 focus:outline-hidden focus:ring-2 ${
                errors.password
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
              tabIndex="-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to PeoplePay360</span>
          )}
        </button>
      </form>

      {/* Demo Quick-Fill Selector */}
      <div className="pt-4 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
          Demo Roles Quick-Fill
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className={`px-2 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${acc.color}`}
                title={`Login as ${acc.role}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{acc.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
