import React from "react";
import { Outlet, Link } from "react-router-dom";
import NotificationToast from "../components/common/NotificationToast";
import { Users, Clock, Calendar, DollarSign, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/30 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background soft ambient blurs */}
      <div className="absolute top-10 -left-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Two-Column Container on Desktop */}
      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand & Feature Highlights */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left px-2 sm:px-4">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/25 ring-4 ring-indigo-50">
              P
            </div>
            <div>
              <span className="font-bold text-2xl text-slate-900 tracking-tight block leading-none">
                PeoplePay<span className="text-indigo-600">360</span>
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                HR & Payroll Suite
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              People. Payroll. <br className="hidden sm:inline" />
              <span className="text-indigo-600">Simplified.</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto lg:mx-0 font-normal leading-relaxed">
              Manage employees, attendance, time off, and multi-rule salary processing from one unified, enterprise workspace.
            </p>
          </div>

          {/* Feature Highlight Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left max-w-lg mx-auto lg:mx-0">
            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Employee Directory</span>
            </div>

            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Live Attendance</span>
            </div>

            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Time Off Allocations</span>
            </div>

            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">2-Step Payrun Batches</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Role-Based Access Control • 100% Real-time Database</span>
          </div>
        </div>

        {/* Right Column: Light Login Card Viewport */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <Outlet />
          <div className="text-center mt-5 text-xs text-slate-500">
            PeoplePay360 • Odoo Hackathon 2026 Edition
          </div>
        </div>
      </div>

      <NotificationToast />
    </div>
  );
}

