import React from "react";
import { SalaryRuleCategoryBadge } from "./SalaryRuleBadge";

export default function PayslipBreakdownTable({ lines = [] }) {
  if (!lines || lines.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs italic">
        No computation lines recorded on this payslip.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200/80 rounded-2xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4 w-28">Rule Code</th>
            <th className="py-3 px-4">Component Name</th>
            <th className="py-3 px-4 w-32">Category</th>
            <th className="py-3 px-4 text-right w-36">Computed Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {lines.map((line, idx) => {
            const isGross = line.category === "Gross";
            const isNet = line.category === "Net";
            const isDeduction = line.category === "Deduction";

            return (
              <tr
                key={idx}
                className={`transition-colors ${
                  isNet
                    ? "bg-emerald-50/60 font-bold"
                    : isGross
                    ? "bg-slate-50/70 font-bold"
                    : "hover:bg-slate-50/50"
                }`}
              >
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                  {line.code}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {line.name}
                </td>
                <td className="py-3 px-4">
                  <SalaryRuleCategoryBadge category={line.category} />
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  <span
                    className={
                      isNet
                        ? "text-emerald-700 text-sm"
                        : isDeduction
                        ? "text-rose-600"
                        : "text-slate-900"
                    }
                  >
                    {isDeduction ? "-" : ""}₹
                    {(Number(line.amount) || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
