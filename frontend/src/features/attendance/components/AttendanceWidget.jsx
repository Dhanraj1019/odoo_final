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
  Activity,
  ArrowRight,
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all">
      {/* Background Accent Decorative Subtle Blob */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-50/70 via-slate-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Attendance Console</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {formattedDateStr}
            </h2>
          </div>

          {/* Digital Live Clock Display */}
          <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl flex items-center gap-3 shadow-2xs self-start sm:self-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-900">
              {formattedTimeStr}
            </span>
          </div>
        </div>

        {/* Action & Status Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Action Slot */}
          <div className="lg:col-span-1 flex flex-col items-stretch justify-center">
            {isLoading ? (
              <div className="h-24 bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-slate-400 border border-slate-200/60">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold">Loading attendance status...</span>
              </div>
            ) : !todayRecord?.checkIn ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={isActionLoading}
                  className="w-full group px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Check In For Shift</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Ready to start your workday? Tap Check In above.
                </p>
              </div>
            ) : isCheckedIn ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={isActionLoading}
                  className="w-full group px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Check Out Now</span>
                    </>
                  )}
                </button>

                {/* Shift In-Progress Timer */}
                {elapsedText && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Timer className="w-4 h-4 text-emerald-600" />
                    <span>Active Shift Duration: <span className="font-mono font-black">{elapsedText}</span></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex flex-col items-center justify-center gap-1.5 text-emerald-800">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Today's Shift Complete</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">
                  Total worked: {todayRecord.workedHours || 0} hours
                </p>
              </div>
            )}
          </div>

          {/* Today's Metrics Breakdown */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Check-In
              </p>
              <p className="font-mono text-sm font-bold text-slate-800">
                {todayRecord?.checkIn
                  ? new Date(todayRecord.checkIn).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Check-Out
              </p>
              <p className="font-mono text-sm font-bold text-slate-800">
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

            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Worked Hours
              </p>
              <p className="font-mono text-sm font-bold text-indigo-600">
                {todayRecord?.workedHours ? `${todayRecord.workedHours} hrs` : "0.00 hrs"}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status
              </p>
              <div>
                {todayRecord?.status ? (
                  <AttendanceStatusBadge status={todayRecord.status} />
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Pending</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
