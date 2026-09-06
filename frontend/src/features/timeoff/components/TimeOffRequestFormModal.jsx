import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Info,
} from "lucide-react";
import timeOffApi from "../../../api/timeOff";
import { addNotification } from "../../notifications/notificationSlice";

export default function TimeOffRequestFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  preselectedEmployeeId = "",
  isEmployeeView = false,
  onSuccess,
  employees = [],
  timeOffTypes = [],
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      employee: "",
      timeOffType: "",
      startDate: "",
      endDate: "",
      duration: "1",
      reason: "",
    },
  });

  const startDateVal = watch("startDate");
  const endDateVal = watch("endDate");
  const durationVal = watch("duration");
  const selectedTypeId = watch("timeOffType");

  const selectedTypeObj = timeOffTypes.find((t) => t._id === selectedTypeId);

  // Preview of days between start and end date based on weekdays
  useEffect(() => {
    if (startDateVal && endDateVal) {
      const s = new Date(startDateVal);
      const e = new Date(endDateVal);
      if (s <= e) {
        let count = 0;
        const cur = new Date(s);
        while (cur <= e) {
          const day = cur.getUTCDay();
          if (day !== 0 && day !== 6) {
            count++; // default 5-day week estimation for display
          }
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
        setValue("duration", String(Math.max(1, count)));
      }
    }
  }, [startDateVal, endDateVal, setValue]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (initialData) {
        reset({
          employee: initialData.employee?._id || initialData.employee || "",
          timeOffType: initialData.timeOffType?._id || initialData.timeOffType || "",
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().slice(0, 10)
            : "",
          endDate: initialData.endDate
            ? new Date(initialData.endDate).toISOString().slice(0, 10)
            : "",
          duration: initialData.duration != null ? String(initialData.duration) : "1",
          reason: initialData.reason || "",
        });
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        reset({
          employee: preselectedEmployeeId || "",
          timeOffType: timeOffTypes[0]?._id || "",
          startDate: todayStr,
          endDate: todayStr,
          duration: "1",
          reason: "",
        });
      }
    }
  }, [isOpen, initialData, preselectedEmployeeId, reset, timeOffTypes]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        timeOffType: formData.timeOffType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: Number(formData.duration),
        reason: formData.reason?.trim() || "",
      };

      if (!isEmployeeView && formData.employee) {
        payload.employee = formData.employee;
      }

      const res = await timeOffApi.createRequest(payload);

      if (res.ok && (res.success || res.data?.request || res.request)) {
        const saved = res.data?.request || res.request;
        dispatch(
          addNotification({
            type: "success",
            message: `Time off request for ${saved.duration} ${
              saved.duration === 1 ? "day" : "days"
            } submitted successfully.`,
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to submit time off request";
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? "Edit Time Off Request" : "Apply for Time Off"}
              </h2>
              <p className="text-xs text-slate-500">
                Submit your leave request and select the requested period
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
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Submission Conflict</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* SECTION 1: Request Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Request Details</span>
              </div>

              {/* Employee Selector (if HR view) */}
              {!isEmployeeView && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("employee", { required: "Employee is required" })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                  {errors.employee && (
                    <p className="text-xs text-rose-600 font-medium">{errors.employee.message}</p>
                  )}
                </div>
              )}

              {/* Time Off Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Time Off Type <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("timeOffType", { required: "Time off type is required" })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                >
                  <option value="">— Select Leave Type —</option>
                  {timeOffTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.isPaid ? "Paid" : "Unpaid"} • {t.unit || "Days"})
                    </option>
                  ))}
                </select>
                {errors.timeOffType && (
                  <p className="text-xs text-rose-600 font-medium">{errors.timeOffType.message}</p>
                )}
              </div>
            </div>

            {/* SECTION 2: Leave Period */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Leave Period</span>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("startDate", { required: "Start date is required" })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  {errors.startDate && (
                    <p className="text-xs text-rose-600 font-medium">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("endDate", { required: "End date is required" })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  {errors.endDate && (
                    <p className="text-xs text-rose-600 font-medium">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Duration Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Duration ({selectedTypeObj?.unit || "Days"}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  {...register("duration", {
                    required: "Duration is required",
                    min: { value: 0.5, message: "Duration must be at least 0.5" },
                  })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {errors.duration && (
                  <p className="text-xs text-rose-600 font-medium">{errors.duration.message}</p>
                )}
              </div>

              {/* Live Duration Estimate Helper Card */}
              {startDateVal && endDateVal && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">
                      Estimated Duration: {durationVal || "1"} {selectedTypeObj?.unit?.toLowerCase() || "working days"}
                    </p>
                    <p className="text-[11px] text-indigo-700 font-normal">
                      Period: {startDateVal} → {endDateVal}. Duration follows the employee's assigned working schedule.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Additional Notes */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Additional Information</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason / Description
                </label>
                <textarea
                  rows={2}
                  {...register("reason")}
                  placeholder="Add any relevant details about your time off request..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Changes" : "Submit Time Off Request"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
