import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileEdit,
} from "lucide-react";
import attendanceApi from "../../../api/attendance";
import { addNotification } from "../../notifications/notificationSlice";

export default function AttendanceFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  preselectedEmployeeId = "",
  onSuccess,
  employees = [],
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
      date: "",
      checkInTime: "",
      checkOutTime: "",
      workedHours: "",
      status: "Present",
      notes: "",
    },
  });

  const checkInVal = watch("checkInTime");
  const checkOutVal = watch("checkOutTime");

  // Auto-calculate worked hours when both checkIn and checkOut are set
  useEffect(() => {
    if (checkInVal && checkOutVal) {
      const [inH, inM] = checkInVal.split(":").map(Number);
      const [outH, outM] = checkOutVal.split(":").map(Number);
      if (!isNaN(inH) && !isNaN(outH)) {
        const diffMinutes = outH * 60 + outM - (inH * 60 + inM);
        if (diffMinutes > 0) {
          setValue("workedHours", (diffMinutes / 60).toFixed(2));
        }
      }
    }
  }, [checkInVal, checkOutVal, setValue]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (initialData) {
        const dateStr = initialData.date
          ? new Date(initialData.date).toISOString().slice(0, 10)
          : "";
        const inTimeStr = initialData.checkIn
          ? new Date(initialData.checkIn).toTimeString().slice(0, 5)
          : "";
        const outTimeStr = initialData.checkOut
          ? new Date(initialData.checkOut).toTimeString().slice(0, 5)
          : "";

        reset({
          employee: initialData.employee?._id || initialData.employee || "",
          date: dateStr,
          checkInTime: inTimeStr,
          checkOutTime: outTimeStr,
          workedHours: initialData.workedHours != null ? String(initialData.workedHours) : "",
          status: initialData.status || "Present",
          notes: initialData.notes || "",
        });
      } else {
        reset({
          employee: preselectedEmployeeId || "",
          date: new Date().toISOString().slice(0, 10),
          checkInTime: "09:00",
          checkOutTime: "18:00",
          workedHours: "8.00",
          status: "Present",
          notes: "",
        });
      }
    }
  }, [isOpen, initialData, preselectedEmployeeId, reset]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Build ISO Date objects for checkIn / checkOut based on chosen date
      const dateBase = formData.date; // "YYYY-MM-DD"
      let checkInDate = null;
      let checkOutDate = null;

      if (formData.checkInTime) {
        checkInDate = new Date(`${dateBase}T${formData.checkInTime}:00Z`);
      }
      if (formData.checkOutTime) {
        checkOutDate = new Date(`${dateBase}T${formData.checkOutTime}:00Z`);
      }

      const payload = {
        employee: formData.employee,
        date: formData.date,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        workedHours: formData.workedHours ? Number(formData.workedHours) : 0,
        status: formData.status,
        notes: formData.notes?.trim() || "",
      };

      let res;
      if (isEditing) {
        res = await attendanceApi.updateAttendance(initialData._id, payload);
      } else {
        res = await attendanceApi.createAttendance(payload);
      }

      if (res.ok && (res.success || res.data?.attendance)) {
        const saved = res.data?.attendance || res.attendance;
        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? "Attendance record corrected successfully."
              : "Manual attendance record logged successfully.",
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to save attendance record";
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Attendance Record" : "Manual Attendance Entry"}
              </h2>
              <p className="text-xs text-slate-500">
                Record or adjust attendance timestamps with audit logging
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
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            {/* Employee Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Employee <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("employee", { required: "Employee is required" })}
                disabled={isEditing}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.employee
                    ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                    : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                } ${isEditing ? "bg-slate-100 cursor-not-allowed text-slate-500" : ""}`}
              >
                <option value="">— Select Employee —</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
              {errors.employee && (
                <p className="text-xs text-rose-600">{errors.employee.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Attendance Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attendance Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("date", { required: "Date is required" })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              {/* Check-In Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Check-In Time
                </label>
                <input
                  type="time"
                  {...register("checkInTime")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Check-Out Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Check-Out Time
                </label>
                <input
                  type="time"
                  {...register("checkOutTime")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Worked Hours */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Worked Hours (Decimal)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="24"
                  {...register("workedHours")}
                  placeholder="e.g. 8.00"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Audit Notes */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason for Manual Entry / Notes
                </label>
                <textarea
                  rows={2}
                  {...register("notes")}
                  placeholder="e.g. Employee forgot to punch out due to offsite client meeting"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
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
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Correction" : "Record Attendance"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
