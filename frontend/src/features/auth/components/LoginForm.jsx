import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials, setAuthError } from "../authSlice";
import { apiFetch } from "../../../lib/apiClient";
import { addNotification } from "../../notifications/notificationSlice";
import Spinner from "../../../components/common/Spinner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Calculator,
  User,
  AlertCircle,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    title: "Admin",
    email: "admin@peoplepay360.local",
    password: "AdminPassword2026!",
    icon: ShieldCheck,
    colorStyle: "bg-purple-50/70 border-purple-200 text-purple-900 hover:bg-purple-100/70 hover:border-purple-300",
    iconStyle: "bg-purple-100 text-purple-700 border-purple-200/80",
  },
  {
    role: "HR Manager",
    title: "HR Manager",
    email: "hrmanager@peoplepay360.local",
    password: "HRManager2026!",
    icon: Briefcase,
    colorStyle: "bg-blue-50/70 border-blue-200 text-blue-900 hover:bg-blue-100/70 hover:border-blue-300",
    iconStyle: "bg-blue-100 text-blue-700 border-blue-200/80",
  },
  {
    role: "HR Payroll Manager",
    title: "Payroll Manager",
    email: "payrollmanager@peoplepay360.local",
    password: "PayrollMgr2026!",
    icon: Calculator,
    colorStyle: "bg-indigo-50/70 border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 hover:border-indigo-300",
    iconStyle: "bg-indigo-100 text-indigo-700 border-indigo-200/80",
  },
  {
    role: "HR Payroll User",
    title: "Payroll User",
    email: "payrolluser@peoplepay360.local",
    password: "PayrollUser2026!",
    icon: UserCheck,
    colorStyle: "bg-teal-50/70 border-teal-200 text-teal-900 hover:bg-teal-100/70 hover:border-teal-300",
    iconStyle: "bg-teal-100 text-teal-700 border-teal-200/80",
  },
  {
    role: "Employee",
    title: "Employee",
    email: "employee@peoplepay360.local",
    password: "Employee2026!",
    icon: User,
    colorStyle: "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300",
    iconStyle: "bg-slate-200/70 text-slate-700 border-slate-300/60",
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
    <div className="space-y-3.5">
      {serverError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
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
              className={`w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-sm transition-all text-slate-900 placeholder:text-slate-400 focus:outline-hidden ${
                errors.email
                  ? "border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                  : "border-slate-200 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/12"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              {...register("password", {
                required: "Password is required",
              })}
              className={`w-full pl-10 pr-10 py-2 bg-white border rounded-xl text-sm transition-all text-slate-900 placeholder:text-slate-400 focus:outline-hidden ${
                errors.password
                  ? "border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                  : "border-slate-200 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/12"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1 shadow-xs"
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

      {/* Demo Roles Quick-Fill */}
      <div className="pt-1">
        <div className="relative my-2.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Demo Access
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc, idx) => {
            const Icon = acc.icon;
            const isLast = idx === DEMO_ACCOUNTS.length - 1;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  acc.colorStyle
                } ${isLast ? "col-span-2 sm:col-span-1" : ""}`}
                title={`Quick fill as ${acc.role}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${acc.iconStyle}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{acc.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
