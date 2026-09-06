import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  Edit3,
  ArrowRight,
} from "lucide-react";

export default function AttendanceOverviewPanel({ attendance = {} }) {
  const {
    present = 0,
    late = 0,
    absent = 0,
    halfDay = 0,
    missingCheckouts = 0,
    manualEdits = 0,
    coveragePercent = 100,
  } = attendance;

  const totalShifts = present + late + absent + halfDay;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
              <p className="text-[11px] text-slate-400">Shift participation & compliance</p>
            </div>
          </div>
          <Link
            to="/attendance"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
          >
            <span>Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Distribution Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Present */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2.5 text-center">
            <p className="text-[11px] font-bold text-emerald-700">Present</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5">{present}</p>
          </div>

          {/* Late */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2.5 text-center">
            <p className="text-[11px] font-bold text-amber-700">Late</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5">{late}</p>
          </div>

          {/* Half Day */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-2.5 text-center">
            <p className="text-[11px] font-bold text-blue-700">Half Day</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5">{halfDay}</p>
          </div>

          {/* Absent */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-2.5 text-center">
            <p className="text-[11px] font-bold text-rose-700">Absent</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5">{absent}</p>
          </div>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Missing Check-outs
          </span>
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            {missingCheckouts}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
            Manual HR Corrections
          </span>
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            {manualEdits}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 font-semibold">Total Logged Records</span>
          <span className="font-mono font-bold text-slate-900">{totalShifts} shifts</span>
        </div>
      </div>
    </div>
  );
}
