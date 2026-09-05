import React from "react";
import { Outlet } from "react-router-dom";
import NotificationToast from "../components/common/NotificationToast";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-2xl shadow-lg shadow-indigo-500/30 mb-4 ring-4 ring-indigo-500/20">
            P
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PeoplePay360</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise HRMS & Payroll Management</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <Outlet />
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Odoo Hackathon 2026 • PeoplePay360 Platform
        </div>
      </div>

      <NotificationToast />
    </div>
  );
}
