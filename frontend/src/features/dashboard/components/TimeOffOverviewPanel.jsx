import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export default function TimeOffOverviewPanel({ timeOff = {} }) {
  const { approvedDays = 0, pendingRequests = 0 } = timeOff;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Time Off Overview</h3>
              <p className="text-[11px] text-slate-400">Leave balance & request approvals</p>
            </div>
          </div>
          <Link
            to="/time-off/requests"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 hover:underline"
          >
            <span>Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Approved Days */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between min-h-[95px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Approved Taken
            </span>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {approvedDays} <span className="text-xs font-semibold text-slate-500">days</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">In current period</p>
            </div>
          </div>

          {/* Pending Requests */}
          <div className={`rounded-xl p-3.5 border flex flex-col justify-between min-h-[95px] ${
            pendingRequests > 0
              ? "bg-amber-50/60 border-amber-200"
              : "bg-slate-50 border-slate-200/90"
          }`}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Pending Action
              </span>
              {pendingRequests > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
            </div>
            <div className="mt-2">
              <p className={`text-2xl font-black font-mono tracking-tight ${
                pendingRequests > 0 ? "text-amber-700" : "text-slate-900"
              }`}>
                {pendingRequests} <span className="text-xs font-semibold text-slate-500">{pendingRequests === 1 ? "req" : "reqs"}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Awaiting HR review</p>
            </div>
          </div>
        </div>
      </div>

      {pendingRequests > 0 && (
        <Link
          to="/time-off/requests"
          className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold text-center transition-colors block mt-2 shadow-2xs"
        >
          Review {pendingRequests} Pending Leave {pendingRequests === 1 ? "Request" : "Requests"}
        </Link>
      )}
    </div>
  );
}
