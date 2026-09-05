import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  Timer,
} from "lucide-react";
import attendanceApi from "../../../api/attendance";
import AttendanceStatusBadge from "./AttendanceStatusBadge";
import { addNotification } from "../../notifications/notificationSlice";

export default function AttendanceWidget({ onAttendanceUpdated = null }) {
  const dispatch = useDispatch();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 1. Digital Clock Interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Today's Attendance Record
  const fetchTodayAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const res = await attendanceApi.listAttendances({
        from: todayIso,
        to: todayIso,
      });

      if (res.ok && (res.data?.attendances || res.attendances)) {
        const list = res.data?.attendances || res.attendances || [];
        setTodayRecord(list[0] || null);
      }
    } catch (err) {
      console.error("Failed to load today's attendance:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  // Handle Check-In
  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      if (res.ok && (res.data?.attendance || res.attendance)) {
        const record = res.data?.attendance || res.attendance;
        setTodayRecord(record);
        dispatch(
          addNotification({
            type: "success",
            message: "Checked in successfully. Have a productive shift!",
          })
        );
        if (onAttendanceUpdated) onAttendanceUpdated(record);
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to check in",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      if (res.ok && (res.data?.attendance || res.attendance)) {
        const record = res.data?.attendance || res.attendance;
        setTodayRecord(record);
        dispatch(
          addNotification({
            type: "success",
            message: `Checked out successfully. Logged ${record.workedHours} worked hours.`,
          })
        );
        if (onAttendanceUpdated) onAttendanceUpdated(record);
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to check out",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsActionLoading(false);
    }
  };

  const isCheckedIn = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut);
  const isCompleted = Boolean(todayRecord?.checkIn && todayRecord?.checkOut);

  // Compute live elapsed time if checked in
  const elapsedText = (() => {
    if (!isCheckedIn || !todayRecord?.checkIn) return null;
    const diffMs = Math.max(0, currentTime.getTime() - new Date(todayRecord.checkIn).getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  })();

  const formattedTimeStr = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDateStr = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Background Subtle Accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Attendance Console</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{formattedDateStr}</h2>
          </div>

          {/* Digital Clock Display */}
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-2xl flex items-center gap-3 backdrop-blur-sm shadow-inner self-start sm:self-center">
            <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-indigo-100">
              {formattedTimeStr}
            </span>
          </div>
        </div>

        {/* Action & Status Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Action Button Slot */}
          <div className="lg:col-span-1 flex flex-col items-stretch justify-center">
            {isLoading ? (
              <div className="h-24 bg-slate-800/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs font-semibold">Loading status...</span>
              </div>
            ) : !todayRecord?.checkIn ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isActionLoading}
                className="w-full group relative overflow-hidden px-6 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 active:scale-98"
              >
                {isActionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
                    <span>CHECK IN FOR SHIFT</span>
                  </>
                )}
              </button>
            ) : isCheckedIn ? (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={isActionLoading}
                className="w-full group relative overflow-hidden px-6 py-5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-base shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all flex items-center justify-center gap-3 active:scale-98"
              >
                {isActionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
                    <span>CHECK OUT NOW</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center gap-3 text-slate-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Today's Shift Completed</span>
              </div>
            )}

            {/* Shift In-Progress Timer */}
            {isCheckedIn && elapsedText && (
              <div className="mt-2.5 flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                <Timer className="w-3.5 h-3.5 animate-spin" />
                <span>Shift Duration: {elapsedText}</span>
              </div>
            )}
          </div>

          {/* Today's Logged Metrics */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Check-In
              </p>
              <p className="font-mono text-sm font-bold text-slate-100">
                {todayRecord?.checkIn
                  ? new Date(todayRecord.checkIn).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Check-Out
              </p>
              <p className="font-mono text-sm font-bold text-slate-100">
                {todayRecord?.checkOut
                  ? new Date(todayRecord.checkOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : isCheckedIn
                  ? "In Progress"
                  : "—"}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Worked Hours
              </p>
              <p className="font-mono text-sm font-bold text-indigo-300">
                {todayRecord?.workedHours ? `${todayRecord.workedHours} hrs` : "0.00 hrs"}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </p>
              <div>
                {todayRecord?.status ? (
                  <AttendanceStatusBadge status={todayRecord.status} />
                ) : (
                  <span className="text-xs text-slate-500 font-medium">Pending</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
