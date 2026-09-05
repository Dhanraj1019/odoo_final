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

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Departmental Distribution</h3>
          <p className="text-[11px] text-slate-400">Headcount {isFull ? "and salary cost " : ""}by organization unit</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalHeadcount} Total Staff
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3 text-center w-28">Active Headcount</th>
              {isFull && <th className="py-2.5 px-3 text-right w-36">Total Net Salary</th>}
              {isFull && <th className="py-2.5 px-3 text-right w-28">Avg / Head</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => {
              const headcount = row.headcount || 0;
              const salary = Number(row.totalSalary) || 0;
              const avg = headcount > 0 && salary > 0 ? Math.round(salary / headcount) : 0;

              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{row.department || "General"}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {headcount}
                    </span>
                  </td>
                  {isFull && (
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {salary > 0 ? `₹${salary.toLocaleString("en-IN")}` : <span className="text-slate-400">₹0</span>}
                    </td>
                  )}
                  {isFull && (
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {avg > 0 ? `₹${avg.toLocaleString("en-IN")}` : <span className="text-slate-400">—</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {isFull && (
            <tfoot className="border-t border-slate-200 bg-slate-50/50 font-bold text-slate-900">
              <tr>
                <td className="py-2.5 px-3">Total</td>
                <td className="py-2.5 px-3 text-center font-mono">{totalHeadcount}</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                  ₹{totalSalary.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
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
