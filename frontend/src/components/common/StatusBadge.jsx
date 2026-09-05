import React from "react";

const STATUS_STYLES = {
  // General & Employees
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  Terminated: "bg-rose-50 text-rose-700 border-rose-200",

  // Payroll & Payrun
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Computed: "bg-sky-50 text-sky-700 border-sky-200",
  Validated: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-200",

  // Time Off & Requests
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Refused: "bg-rose-50 text-rose-700 border-rose-200",

  // Attendance
  Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Late: "bg-amber-50 text-amber-700 border-amber-200",
  Absent: "bg-rose-50 text-rose-700 border-rose-200",
  "Half Day": "bg-purple-50 text-purple-700 border-purple-200",
  "On Leave": "bg-blue-50 text-blue-700 border-blue-200",
};

export default function StatusBadge({ status, className = "" }) {
  const styles = STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {status || "Unknown"}
    </span>
  );
}
