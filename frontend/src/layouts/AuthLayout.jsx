import React from "react";
import { Outlet } from "react-router-dom";
import NotificationToast from "../components/common/NotificationToast";
import { Check, ShieldCheck } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 lg:py-8 lg:px-8 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Main Two-Column Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Brand & Product Introduction */}
        <div className="lg:col-span-6 space-y-5 text-left max-w-lg mx-auto lg:mx-0">
          {/* Logo & Category */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                P
              </div>
              <span className="font-bold text-2xl text-slate-900 tracking-tight">
                PeoplePay360
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">
              HR & Payroll Platform
            </p>
          </div>

          {/* Main Headline & Description */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[38px] font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              People. Payroll. <br />
              Simplified.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Manage employees, attendance, time off, and payroll from one unified enterprise workspace.
            </p>
          </div>

          {/* Clean Vertical Feature List */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-1">
            {[
              "Employee Management",
              "Live Attendance",
              "Time Off Management",
              "Payroll Processing",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2.5 text-slate-800 text-xs sm:text-sm font-medium"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>

          {/* Subtle Enterprise Platform Preview Badge / Overview */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Enterprise Cloud Workspace
              </span>
              <span className="text-[11px] font-medium text-slate-500">v2026.1</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Attendance</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">Live Sync</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Time Off</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">Automated</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Payroll</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">Compliant</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Secure • Role-Based • Real-Time Enterprise Engine</span>
          </div>
        </div>

        {/* Right Column: Login Card Viewport */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <Outlet />
          <div className="text-center mt-4 text-xs text-slate-400 font-medium">
            PeoplePay360 • Enterprise Edition
          </div>
        </div>
      </div>

      <NotificationToast />
    </div>
  );
}
