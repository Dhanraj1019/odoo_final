import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, Loader2, X } from "lucide-react";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";

export default function TerminateModal({
  isOpen = false,
  onClose,
  employee,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !employee) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await employeesApi.deleteEmployee(employee._id);
      if (res.ok && (res.success || res.data?.employee)) {
        const updated = res.data?.employee || res.employee || { ...employee, status: "Terminated" };
        dispatch(
          addNotification({
            type: "success",
            message: `Employee "${employee.fullName}" has been marked as Terminated.`,
          })
        );
        if (onSuccess) onSuccess(updated);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to terminate employee";
        dispatch(addNotification({ type: "error", message: msg }));
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Terminate Employee Record
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to terminate{" "}
                <span className="font-semibold text-slate-800">{employee.fullName}</span> (
                <span className="font-mono">{employee.employeeCode}</span>)?
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 leading-relaxed">
            <strong>Note:</strong> This performs a soft termination by updating the employee's status
            to <span className="font-semibold">Terminated</span>. All historical records
            (contracts, attendance, and payslips) will be preserved for statutory compliance.
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Terminating...</span>
                </>
              ) : (
                <span>Confirm Termination</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
