import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Mail,
  Phone,
  User,
  ChevronRight,
  Briefcase,
  Layers,
} from "lucide-react";
import EmployeeStatusBadge from "./EmployeeStatusBadge";

export default function EmployeeKanbanBoard({
  employees = [],
  isLoading = false,
  departments = [],
}) {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState("department"); // 'department' | 'status'

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name = "") => {
    const colors = [
      "bg-indigo-100 text-indigo-700 border-indigo-200",
      "bg-blue-100 text-blue-700 border-blue-200",
      "bg-emerald-100 text-emerald-700 border-emerald-200",
      "bg-violet-100 text-violet-700 border-violet-200",
      "bg-amber-100 text-amber-700 border-amber-200",
      "bg-rose-100 text-rose-700 border-rose-200",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Group columns from CURRENT filtered employees
  const columns = useMemo(() => {
    if (!employees || employees.length === 0) {
      return [];
    }

    if (groupBy === "department") {
      const deptMap = new Map();
      const unassignedEmployees = [];

      employees.forEach((emp) => {
        const deptObj = emp.department;
        const deptId = deptObj?._id ? deptObj._id.toString() : typeof deptObj === "string" ? deptObj : null;
        const deptName =
          deptObj?.name ||
          (deptId && departments.find((d) => (d._id || d.id)?.toString() === deptId)?.name) ||
          null;

        if (deptId && deptName) {
          if (!deptMap.has(deptId)) {
            deptMap.set(deptId, {
              id: deptId,
              title: deptName,
              items: [],
            });
          }
          deptMap.get(deptId).items.push(emp);
        } else {
          unassignedEmployees.push(emp);
        }
      });

      // Sort non-empty departments alphabetically
      const result = Array.from(deptMap.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      // Only add Unassigned column if there are unassigned employees
      if (unassignedEmployees.length > 0) {
        result.push({
          id: "unassigned",
          title: "Unassigned Department",
          items: unassignedEmployees,
        });
      }

      return result;
    } else {
      // Group by Status from filtered employees
      const statusMap = new Map();
      const knownStatuses = ["Active", "Inactive", "Terminated"];

      employees.forEach((emp) => {
        const st = emp.status || "Active";
        if (!statusMap.has(st)) {
          statusMap.set(st, {
            id: st,
            title: st,
            items: [],
          });
        }
        statusMap.get(st).items.push(emp);
      });

      // Order known statuses first, then any extra
      const result = [];
      knownStatuses.forEach((st) => {
        if (statusMap.has(st) && statusMap.get(st).items.length > 0) {
          result.push(statusMap.get(st));
          statusMap.delete(st);
        }
      });

      // Any remaining non-empty status
      statusMap.forEach((col) => {
        if (col.items.length > 0) {
          result.push(col);
        }
      });

      return result;
    }
  }, [employees, departments, groupBy]);

  return (
    <div className="space-y-4">
      {/* Group By Selector */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Group board by:</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setGroupBy("department")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${groupBy === "department"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Department
          </button>
          <button
            type="button"
            onClick={() => setGroupBy("status")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${groupBy === "status"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Empty State when no filtered employees exist */}
      {!isLoading && employees.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No employees found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or clear your active filters.
          </p>
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {columns.map((col) => (
            <div
              key={col.id}
              className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 min-h-[200px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight truncate max-w-[180px]" title={col.title}>
                    {col.title}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-xs shrink-0">
                  {col.items.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1">
                {col.items.map((emp) => (
                  <div
                    key={emp._id}
                    onClick={() => navigate(`/employees/${emp._id}`)}
                    className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer group flex flex-col gap-3 hover:-translate-y-0.5"
                  >
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${getAvatarColor(
                            emp.fullName
                          )}`}
                        >
                          {getInitials(emp.fullName)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                            {emp.fullName}
                          </h4>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>

                      <div className="p-1 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Job Position & Department */}
                    <div className="space-y-1 text-xs text-slate-600">
                      {emp.jobPosition?.name && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{emp.jobPosition.name}</span>
                        </div>
                      )}
                      {groupBy !== "department" && emp.department?.name && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{emp.department.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact & Manager */}
                    <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      {emp.workingSchedule?.name && (
                        <div className="text-[11px] text-slate-400 truncate">
                          Schedule: <span className="text-slate-600 font-medium">{emp.workingSchedule.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Tags */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {emp.employeeType || "Full-Time"}
                      </span>
                      <EmployeeStatusBadge status={emp.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
