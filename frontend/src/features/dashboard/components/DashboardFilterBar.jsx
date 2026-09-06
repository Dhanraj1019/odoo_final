import React from "react";
import { Filter, Calendar, Building2, Users, RefreshCw } from "lucide-react";

const EMPLOYEE_TYPES = ["All", "Full-time", "Part-time", "Contract", "Intern"];

export default function DashboardFilterBar({
  period = "",
  onPeriodChange,
  from = "",
  onFromChange,
  to = "",
  onToChange,
  department = "",
  onDepartmentChange,
  employeeType = "All",
  onEmployeeTypeChange,
  departments = [],
  onRefresh,
  isLoading = false,
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Period (Month) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 sm:h-10 hover:border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10 transition-all">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 shrink-0">Month:</span>
            <input
              type="month"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-hidden focus:ring-0 p-0 cursor-pointer"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 sm:h-10 hover:border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10 transition-all max-w-full sm:max-w-xs">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 shrink-0">Dept:</span>
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-hidden focus:ring-0 p-0 cursor-pointer truncate"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Type Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 sm:h-10 hover:border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10 transition-all">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 shrink-0">Type:</span>
            <select
              value={employeeType}
              onChange={(e) => onEmployeeTypeChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-hidden focus:ring-0 p-0 cursor-pointer"
            >
              {EMPLOYEE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 h-9 sm:h-10 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            title="Refresh Dashboard Analytics"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 transition-transform ${
                isLoading ? "animate-spin text-indigo-600" : "text-slate-500"
              }`}
            />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
