import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import timeOffApi from "../../../api/timeOff";
import { addNotification } from "../../notifications/notificationSlice";

export default function TimeOffTypeFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  onSuccess,
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
      name: "",
      unit: "Days",
      requiresAllocation: true,
      requiresApproval: true,
      affectsPayroll: true,
      isPaid: true,
      status: "Active",
    },
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (initialData) {
        reset({
          name: initialData.name || "",
          unit: initialData.unit || "Days",
          requiresAllocation: initialData.requiresAllocation !== false,
          requiresApproval: initialData.requiresApproval !== false,
          affectsPayroll: initialData.affectsPayroll !== false,
          isPaid: initialData.isPaid !== false,
          status: initialData.status || "Active",
        });
      } else {
        reset({
          name: "",
          unit: "Days",
          requiresAllocation: true,
          requiresApproval: true,
          affectsPayroll: true,
          isPaid: true,
          status: "Active",
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name.trim(),
        unit: formData.unit,
        requiresAllocation: Boolean(formData.requiresAllocation),
        requiresApproval: Boolean(formData.requiresApproval),
        affectsPayroll: Boolean(formData.affectsPayroll),
        isPaid: Boolean(formData.isPaid),
        status: formData.status,
      };

      let res;
      if (isEditing) {
        res = await timeOffApi.updateType(initialData._id, payload);
      } else {
        res = await timeOffApi.createType(payload);
      }

      if (res.ok && (res.success || res.data?.type || res.type)) {
        const saved = res.data?.type || res.type;
        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? `Time off type "${saved.name}" updated successfully.`
              : `Time off type "${saved.name}" created successfully.`,
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to save leave type";
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Type — ${initialData?.name}` : "New Time Off Type"}
              </h2>
              <p className="text-xs text-slate-500">
                Configure leave category parameters and approval requirements
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
            {/* Type Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Leave Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                placeholder="e.g. Paid Time Off (PTO), Sick Leave, Maternity Leave"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Measurement Unit
                </label>
                <select
                  {...register("unit")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="Days">Days</option>
                  <option value="Hours">Hours</option>
                </select>
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
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Policy Checkboxes */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("requiresAllocation")}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Requires Quota Allocation</p>
                  <p className="text-slate-400">
                    Employees must have an approved allocation balance before requesting
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("requiresApproval")}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Requires Manager / HR Approval</p>
                  <p className="text-slate-400">
                    Requests stay in 'Submitted' status until formally approved
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("isPaid")}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Paid Leave Category</p>
                  <p className="text-slate-400">Employees receive standard salary compensation</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("affectsPayroll")}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Affects Payroll Calculations</p>
                  <p className="text-slate-400">
                    Factored into monthly payslip worked days / deductions
                  </p>
                </div>
              </label>
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
                  <span>{isEditing ? "Save Changes" : "Create Type"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
