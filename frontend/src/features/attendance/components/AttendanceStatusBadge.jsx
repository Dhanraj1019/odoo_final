import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Calendar, XCircle, AlertCircle } from "lucide-react";

export default function AttendanceStatusBadge({ status, className = "" }) {
  const norm = status || "Present";

  switch (norm) {
    case "Present":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Present
        </span>
      );

    case "Late":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-500" />
          Late Arrival
        </span>
      );

    case "Half Day":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 ${className}`}
        >
          <AlertTriangle className="w-3 h-3 text-violet-500" />
          Half Day
        </span>
      );

    case "On Leave":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 ${className}`}
        >
          <Calendar className="w-3 h-3 text-blue-500" />
          On Leave
        </span>
      );

    case "Absent":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
        >
          <XCircle className="w-3 h-3 text-rose-500" />
          Absent
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-slate-400" />
          {norm}
        </span>
      );
  }
}
