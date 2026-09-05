import React from "react";
import { CheckCircle2, Archive } from "lucide-react";

export default function WorkingScheduleStatusBadge({ status, className = "" }) {
  const norm = status || "Active";

  if (norm === "Active") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
    >
      <Archive className="w-3 h-3 text-slate-400" />
      Archived
    </span>
  );
}
