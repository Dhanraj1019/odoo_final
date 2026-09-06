import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  CalendarDays,
  User,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import timeOffApi from "../../../api/timeOff";
import { addNotification } from "../../notifications/notificationSlice";

export default function TimeOffAllocationFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  preselectedEmployeeId = "",
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
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      employee: "",
      timeOffType: "",
      allocatedAmount: "",
      validFrom: "",
      validTo: "",
    },
  });

  const watchedValues = useWatch({
    control,
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (initialData) {
        reset({
          employee: initialData.employee?._id || initialData.employee || "",
          timeOffType: initialData.timeOffType?._id || initialData.timeOffType || "",
          allocatedAmount:
            initialData.allocatedAmount != null ? String(initialData.allocatedAmount) : "",
          validFrom: initialData.validFrom
            ? new Date(initialData.validFrom).toISOString().slice(0, 10)
            : "",
          validTo: initialData.validTo
            ? new Date(initialData.validTo).toISOString().slice(0, 10)
            : "",
        });
      } else {
        reset({
          employee: preselectedEmployeeId || "",
          timeOffType: timeOffTypes[0]?._id || "",
          allocatedAmount: "15",
          validFrom: `${new Date().getFullYear()}-01-01`,
          validTo: `${new Date().getFullYear()}-12-31`,
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
        employee: formData.employee,
        timeOffType: formData.timeOffType,
        allocatedAmount: Number(formData.allocatedAmount),
        validFrom: formData.validFrom || null,
        validTo: formData.validTo || null,
      };

      let res;
      if (isEditing) {
        res = await timeOffApi.updateAllocation(initialData._id, payload);
      } else {
        res = await timeOffApi.createAllocation(payload);
      }

      if (res.ok && (res.success || res.data?.allocation || res.allocation)) {
        const saved = res.data?.allocation || res.allocation;
        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? "Allocation updated successfully."
              : "Leave allocation granted successfully (Pending Approval).",
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to save allocation";
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

  // Find active employee & time off type for summary card
  const activeEmployee = employees.find(
    (e) => String(e._id) === String(watchedValues?.employee)
  ) || (initialData?.employee?.fullName ? initialData.employee : null);

  const activeTimeOffType = timeOffTypes.find(
    (t) => String(t._id) === String(watchedValues?.timeOffType)
  ) || (initialData?.timeOffType?.name ? initialData.timeOffType : null);

  const formatSummaryDate = (d) => {
    if (!d) return "Open";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Time Off Allocation" : "Allocate Time Off"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update the allocation details and validity period."
                  : "Grant a time off quota to an employee."}
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
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* SECTION 1: Allocation Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Allocation Details
                </h3>
              </div>

              {/* Employee Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("employee", { required: "Employee is required" })}
                  disabled={isEditing}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                    errors.employee
                      ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  } ${isEditing ? "bg-slate-100 cursor-not-allowed text-slate-500" : "text-slate-800"}`}
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

              {/* Time Off Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Time Off Type <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("timeOffType", { required: "Time off type is required" })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="">— Select Time Off Type —</option>
                  {timeOffTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.unit || "Days"})
                    </option>
                  ))}
                </select>
                {errors.timeOffType && (
                  <p className="text-xs text-rose-600">{errors.timeOffType.message}</p>
                )}
              </div>
            </div>

            {/* SECTION 2: Allocation Amount */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Allocation Amount
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Allocated Amount{" "}
                  {activeTimeOffType?.unit ? `(${activeTimeOffType.unit})` : "(Days/Hours)"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    {...register("allocatedAmount", {
                      required: "Allocated amount is required",
                      min: { value: 0.5, message: "Must be greater than 0" },
                    })}
                    placeholder="e.g. 15"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[11px] font-bold text-slate-400 uppercase">
                    {activeTimeOffType?.unit || "Days"}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  The amount of time off granted to this employee.
                </p>
                {errors.allocatedAmount && (
                  <p className="text-xs text-rose-600">{errors.allocatedAmount.message}</p>
                )}
              </div>
            </div>

            {/* SECTION 3: Validity Period */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Validity Period
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Valid From</label>
                  <input
                    type="date"
                    {...register("validFrom")}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Valid Until</label>
                  <input
                    type="date"
                    {...register("validTo")}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Live Allocation Summary Card */}
            {activeEmployee && activeTimeOffType && watchedValues?.allocatedAmount && (
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Allocation Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Employee</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {activeEmployee.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Time Off Type</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {activeTimeOffType.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Allocated Quota</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {Number(watchedValues.allocatedAmount || 0).toFixed(1)}{" "}
                      {activeTimeOffType.unit?.toLowerCase() || "days"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Validity</span>
                    <span className="font-medium text-slate-700">
                      {formatSummaryDate(watchedValues.validFrom)} →{" "}
                      {formatSummaryDate(watchedValues.validTo)}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Changes" : "Allocate Time Off"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

