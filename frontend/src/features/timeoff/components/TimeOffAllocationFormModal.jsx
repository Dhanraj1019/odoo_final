import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  Award,
  User,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Leave Allocation" : "Grant Leave Allocation"}
              </h2>
              <p className="text-xs text-slate-500">
                Assign annual quota allowances per employee and leave type
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
          <div className="p-6 space-y-4">
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

            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Time Off Type <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("timeOffType", { required: "Time off type is required" })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">— Select Time Off Type —</option>
                {timeOffTypes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.unit || "Days"})
                  </option>
                ))}
              </select>
            </div>

            {/* Allocated Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Allocated Amount (Days/Hours) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                {...register("allocatedAmount", {
                  required: "Allocated amount is required",
                  min: { value: 0.5, message: "Must be greater than 0" },
                })}
                placeholder="e.g. 15"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {errors.allocatedAmount && (
                <p className="text-xs text-rose-600">{errors.allocatedAmount.message}</p>
              )}
            </div>

            {/* Validity Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Valid From
                </label>
                <input
                  type="date"
                  {...register("validFrom")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Valid To
                </label>
                <input
                  type="date"
                  {...register("validTo")}
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Changes" : "Grant Allocation"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
