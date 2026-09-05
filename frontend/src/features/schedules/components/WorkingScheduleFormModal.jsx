import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  X,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import workingSchedulesApi from "../../../api/workingSchedules";
import { addNotification } from "../../notifications/notificationSlice";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

export default function WorkingScheduleFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("My Company");
  const [status, setStatus] = useState("Active");
  const [daysState, setDaysState] = useState(() =>
    ALL_DAYS.map((day) => ({
      day,
      enabled: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day),
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60,
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize or reset form state
  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (initialData) {
        setName(initialData.name || "");
        setCompany(initialData.company || "My Company");
        setStatus(initialData.status || "Active");

        const existingDaysMap = {};
        if (Array.isArray(initialData.days)) {
          initialData.days.forEach((d) => {
            existingDaysMap[d.day] = d;
          });
        }

        setDaysState(
          ALL_DAYS.map((day) => {
            const found = existingDaysMap[day];
            if (found) {
              return {
                day,
                enabled: true,
                startTime: found.startTime || "09:00",
                endTime: found.endTime || "18:00",
                breakMinutes: found.breakMinutes != null ? found.breakMinutes : 60,
              };
            }
            return {
              day,
              enabled: false,
              startTime: "09:00",
              endTime: "18:00",
              breakMinutes: 60,
            };
          })
        );
      } else {
        setName("");
        setCompany("My Company");
        setStatus("Active");
        setDaysState(
          ALL_DAYS.map((day) => ({
            day,
            enabled: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day),
            startTime: "09:00",
            endTime: "18:00",
            breakMinutes: 60,
          }))
        );
      }
    }
  }, [isOpen, initialData]);

  // Live calculation of weekly hours
  const liveWeeklyHours = useMemo(() => {
    let totalMinutes = 0;
    daysState.forEach((d) => {
      if (d.enabled) {
        const start = parseTimeToMinutes(d.startTime);
        const end = parseTimeToMinutes(d.endTime);
        const worked = Math.max(0, end - start - (Number(d.breakMinutes) || 0));
        totalMinutes += worked;
      }
    });
    return Number((totalMinutes / 60).toFixed(2));
  }, [daysState]);

  if (!isOpen) return null;

  const handleDayToggle = (dayName) => {
    setDaysState((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const handleDayFieldChange = (dayName, field, value) => {
    setDaysState((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, [field]: value } : d))
    );
  };

  // Presets
  const applyPreset = (type) => {
    if (type === "5day") {
      setDaysState(
        ALL_DAYS.map((day) => ({
          day,
          enabled: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day),
          startTime: "09:00",
          endTime: "18:00",
          breakMinutes: 60,
        }))
      );
    } else if (type === "6day") {
      setDaysState(
        ALL_DAYS.map((day) => ({
          day,
          enabled: day !== "Sunday",
          startTime: "09:00",
          endTime: "18:00",
          breakMinutes: 60,
        }))
      );
    } else if (type === "parttime") {
      setDaysState(
        ALL_DAYS.map((day) => ({
          day,
          enabled: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day),
          startTime: "09:00",
          endTime: "13:00",
          breakMinutes: 0,
        }))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Working schedule name is required");
      return;
    }

    const enabledDays = daysState.filter((d) => d.enabled);
    if (enabledDays.length === 0) {
      setErrorMessage("Please select at least one working day in the weekly schedule");
      return;
    }

    // Validate times
    for (const d of enabledDays) {
      const start = parseTimeToMinutes(d.startTime);
      const end = parseTimeToMinutes(d.endTime);
      if (start >= end) {
        setErrorMessage(`Invalid hours for ${d.day}: start time must be earlier than end time`);
        return;
      }
    }

    const payloadDays = enabledDays.map((d) => ({
      day: d.day,
      startTime: d.startTime,
      endTime: d.endTime,
      breakMinutes: Number(d.breakMinutes) || 0,
    }));

    const payload = {
      name: name.trim(),
      company: company.trim() || "My Company",
      days: payloadDays,
      status,
    };

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let res;
      if (isEditing) {
        res = await workingSchedulesApi.updateWorkingSchedule(initialData._id, payload);
      } else {
        res = await workingSchedulesApi.createWorkingSchedule(payload);
      }

      if (res.ok && (res.success || res.data?.workingSchedule)) {
        const saved = res.data?.workingSchedule || res.workingSchedule;
        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? `Schedule "${saved.name}" updated successfully.`
              : `Working schedule "${saved.name}" created (${saved.totalWeeklyHours} hrs/week).`,
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to save schedule";
        setErrorMessage(msg);
        dispatch(addNotification({ type: "error", message: msg }));
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Schedule — ${initialData?.name}` : "New Working Schedule"}
              </h2>
              <p className="text-xs text-slate-500">
                Configure weekly shift pattern, operating hours, and break rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* General Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Schedule Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard 40 Hours"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="My Company"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Quick Presets & Live Hours Preview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">Quick Shift Presets</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("5day")}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                  >
                    Standard 5-Day (40h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("6day")}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                  >
                    6-Day Work Week (48h)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("parttime")}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                  >
                    Part-Time (20h)
                  </button>
                </div>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl border border-indigo-200/80 shadow-xs flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    Total Weekly Hours
                  </p>
                  <p className="text-lg font-black text-indigo-700 font-mono">
                    {liveWeeklyHours.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-slate-500">hrs/week</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly 7-Day Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weekly Operating Grid (Monday – Sunday)
              </h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                {daysState.map((d) => {
                  const startMin = parseTimeToMinutes(d.startTime);
                  const endMin = parseTimeToMinutes(d.endTime);
                  const dailyWorkedHours = d.enabled
                    ? Math.max(0, (endMin - startMin - (Number(d.breakMinutes) || 0)) / 60)
                    : 0;

                  return (
                    <div
                      key={d.day}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        d.enabled ? "bg-white" : "bg-slate-50/50 opacity-60"
                      }`}
                    >
                      {/* Day Checkbox */}
                      <label className="flex items-center gap-3 cursor-pointer min-w-[140px] select-none">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={() => handleDayToggle(d.day)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span
                          className={`text-sm font-bold ${
                            d.enabled ? "text-slate-900" : "text-slate-400 line-through"
                          }`}
                        >
                          {d.day}
                        </span>
                      </label>

                      {/* Time Controls */}
                      {d.enabled ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Start:</span>
                            <input
                              type="time"
                              value={d.startTime}
                              onChange={(e) =>
                                handleDayFieldChange(d.day, "startTime", e.target.value)
                              }
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">End:</span>
                            <input
                              type="time"
                              value={d.endTime}
                              onChange={(e) =>
                                handleDayFieldChange(d.day, "endTime", e.target.value)
                              }
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Break (mins):</span>
                            <input
                              type="number"
                              min="0"
                              max="300"
                              value={d.breakMinutes}
                              onChange={(e) =>
                                handleDayFieldChange(d.day, "breakMinutes", e.target.value)
                              }
                              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="ml-auto sm:ml-0 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {dailyWorkedHours.toFixed(2)} hrs
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Non-working Day / Off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Schedule Changes" : "Create Schedule"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
