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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Total Net Salary
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight truncate">
              ₹{(Number(kpis.totalNetSalaryPaid) || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Disbursed in period</p>
          </div>
        </div>
      )}

      {/* 2. Average Salary (Full Scope Only) */}
      {isFull && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Avg Net Salary
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight truncate">
              ₹{(Number(kpis.averageSalary) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Per paid employee</p>
          </div>
        </div>
      )}

      {/* 3. Payslips Processed (Full Scope Only) */}
      {isFull && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Payslips Processed
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
              {kpis.payslipsGenerated || 0}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Generated slips</p>
          </div>
        </div>
      )}

      {/* 4. Active Workforce (HR Scope only) */}
      {!isFull && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Active Workforce
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
              {totalHeadcount} <span className="text-xs font-semibold text-slate-500">staff</span>
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Across all departments</p>
          </div>
        </div>
      )}

      {/* 5. Approved Time Off Days */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            Approved Leave
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
            {kpis.approvedTimeOffDays || 0} <span className="text-xs font-semibold text-slate-500">days</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Total taken in period</p>
        </div>
      </div>

      {/* 6. Attendance Health */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            Attendance Health
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
            {kpis.attendanceHealthPercent !== undefined ? kpis.attendanceHealthPercent : 100}%
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Punctual & present shifts</p>
        </div>
      </div>

      {/* 7. Workforce Coverage */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between min-h-[125px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
            Shift Coverage
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
            {attendanceOverview.coveragePercent !== undefined ? attendanceOverview.coveragePercent : 100}%
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Non-absent attendance</p>
        </div>
      </div>
    </div>
  );
}
