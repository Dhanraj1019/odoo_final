import React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

/**
 * Status Badge for Employees
 * Supports: 'Active', 'Inactive', 'Terminated'
 */
export default function EmployeeStatusBadge({ status, className = "" }) {
  const normStatus = status || "Active";

  switch (normStatus) {
    case "Active":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );

    case "Inactive":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-500" />
          Inactive
        </span>
      );

    case "Terminated":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
        >
          <XCircle className="w-3 h-3 text-rose-500" />
          Terminated
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-slate-400" />
          {normStatus}
        </span>
      );
  }
}
