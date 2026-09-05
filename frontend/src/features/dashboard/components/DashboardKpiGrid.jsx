import React from "react";
import {
  CreditCard,
  Calculator,
  FileText,
  Calendar,
  Activity,
  Users,
  TrendingUp,
} from "lucide-react";

export default function DashboardKpiGrid({ kpis = {}, scope = "full", attendanceOverview = {}, departmentBreakdown = [] }) {
  const isFull = scope === "full";

  const totalHeadcount = departmentBreakdown.reduce((sum, d) => sum + (d.headcount || 0), 0);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFull ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4"} gap-4`}>
      {/* 1. Total Net Salary Paid (Full Scope Only) */}
      {isFull && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Net Salary
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
              ₹{(Number(kpis.totalNetSalaryPaid) || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Disbursed in period</p>
          </div>
        </div>
      )}

      {/* 2. Average Salary (Full Scope Only) */}
      {isFull && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Avg Net Salary
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
              ₹{(Number(kpis.averageSalary) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Per paid employee</p>
          </div>
        </div>
      )}

      {/* 3. Payslips Processed (Full Scope Only) */}
      {isFull && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Payslips Processed
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900 tracking-tight">
              {kpis.payslipsGenerated || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Generated slips</p>
          </div>
        </div>
      )}

      {/* 4. Active Workforce (HR Scope & general) */}
      {!isFull && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Workforce
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900 tracking-tight">
              {totalHeadcount} <span className="text-xs font-normal text-slate-500">staff</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all departments</p>
          </div>
        </div>
      )}

      {/* 5. Approved Time Off Days */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Approved Leave
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl font-black text-slate-900 tracking-tight">
            {kpis.approvedTimeOffDays || 0} <span className="text-xs font-normal text-slate-500">days</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total taken in period</p>
        </div>
      </div>

      {/* 6. Attendance Health */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Attendance Health
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl font-black text-slate-900 tracking-tight">
            {kpis.attendanceHealthPercent !== undefined ? kpis.attendanceHealthPercent : 100}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Punctual & present shifts</p>
        </div>
      </div>

      {/* 7. Workforce Coverage */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Shift Coverage
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl font-black text-slate-900 tracking-tight">
            {attendanceOverview.coveragePercent !== undefined ? attendanceOverview.coveragePercent : 100}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Non-absent attendance</p>
        </div>
      </div>
    </div>
  );
}
