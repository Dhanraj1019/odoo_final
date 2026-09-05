import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export default function TimeOffOverviewPanel({ timeOff = {} }) {
  const { approvedDays = 0, pendingRequests = 0 } = timeOff;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Time Off Overview</h3>
            <p className="text-[11px] text-slate-400">Leave balance & request approvals</p>
          </div>
        </div>
        <Link
          to="/time-off/requests"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
        >
          <span>Requests</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
        {/* Approved Days */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Approved Taken
          </span>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {approvedDays}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Days in period</p>
          </div>
        </div>

        {/* Pending Requests */}
        <div className={`rounded-xl p-3 border flex flex-col justify-between ${
          pendingRequests > 0
            ? "bg-amber-50/50 border-amber-200"
            : "bg-slate-50 border-slate-200/80"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Action
            </span>
            {pendingRequests > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-black font-mono tracking-tight ${
              pendingRequests > 0 ? "text-amber-700" : "text-slate-900"
            }`}>
              {pendingRequests}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting HR review</p>
          </div>
        </div>
      </div>

      {pendingRequests > 0 && (
        <Link
          to="/time-off/requests"
          className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold text-center transition-colors block mt-auto"
        >
          Review {pendingRequests} Pending Leave {pendingRequests === 1 ? "Request" : "Requests"}
        </Link>
      )}
    </div>
  );
}
