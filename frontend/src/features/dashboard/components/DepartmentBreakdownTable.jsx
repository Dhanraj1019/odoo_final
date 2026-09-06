import React from "react";
import { Building2, Users, CreditCard } from "lucide-react";

export default function DepartmentBreakdownTable({ data = [], scope = "full" }) {
  const isFull = scope === "full";

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-center text-slate-400 text-xs">
        No department data available for this filter range.
      </div>
    );
  }

  const totalHeadcount = data.reduce((sum, d) => sum + (d.headcount || 0), 0);
  const totalSalary = isFull ? data.reduce((sum, d) => sum + (Number(d.totalSalary) || 0), 0) : 0;

  // Clean department name formatter: remove raw database IDs, timestamps and internal strings
  const formatDeptName = (name) => {
    if (!name) return "General";
    let clean = name
      .replace(/[0-9a-fA-F]{24}/g, "")
      .replace(/Dept\d+/gi, "")
      .replace(/\d{10,}/g, "")
      .trim();
    return clean || name || "General";
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Departmental Distribution</h3>
          <p className="text-[11px] text-slate-400">Headcount {isFull ? "and salary cost " : ""}by organization unit</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            {totalHeadcount} Total Staff
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3.5">Department</th>
              <th className="py-3 px-3.5 text-center w-32">Active Headcount</th>
              {isFull && <th className="py-3 px-3.5 text-right w-40">Total Net Salary</th>}
              {isFull && <th className="py-3 px-3.5 text-right w-32">Avg / Head</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, idx) => {
              const headcount = row.headcount || 0;
              const salary = Number(row.totalSalary) || 0;
              const avg = headcount > 0 && salary > 0 ? Math.round(salary / headcount) : 0;
              const deptName = formatDeptName(row.department);

              return (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-none" title={deptName}>{deptName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                      {headcount}
                    </span>
                  </td>
                  {isFull && (
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      {salary > 0 ? `₹${salary.toLocaleString("en-IN")}` : <span className="text-slate-400">₹0</span>}
                    </td>
                  )}
                  {isFull && (
                    <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                      {avg > 0 ? `₹${avg.toLocaleString("en-IN")}` : <span className="text-slate-400">—</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {isFull && (
            <tfoot className="border-t border-slate-200 bg-slate-50/80 font-bold text-slate-900 text-xs">
              <tr>
                <td className="py-3 px-3.5">Total</td>
                <td className="py-3 px-3.5 text-center font-mono">{totalHeadcount}</td>
                <td className="py-3 px-3.5 text-right font-mono text-emerald-700">
                  ₹{totalSalary.toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                  {totalHeadcount > 0 ? `₹${Math.round(totalSalary / totalHeadcount).toLocaleString("en-IN")}` : "—"}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
