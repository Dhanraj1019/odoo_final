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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period (Month) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Month:</span>
            <input
              type="month"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Dept:</span>
            <select
              value={department}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
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
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Type:</span>
            <select
              value={employeeType}
              onChange={(e) => onEmployeeTypeChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
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
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-60"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
