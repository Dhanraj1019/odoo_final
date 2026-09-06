import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, Trash2, X, AlertCircle } from "lucide-react";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";

export default function DeleteEmployeeModal({
  isOpen = false,
  onClose,
  employee,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !employee) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const res = await employeesApi.deleteEmployee(employee._id);

      if (res.ok && (res.success || res.status === 200)) {
        dispatch(
          addNotification({
            type: "success",
            message: "Employee deleted successfully.",
          })
        );
        onClose();
        navigate("/employees", { replace: true });
      } else {
        const msg =
          res.message ||
          res.error ||
          "Unable to delete employee. Please verify related records and try again.";
        setErrorMessage(msg);
        dispatch(
          addNotification({
            type: "error",
            message: msg,
          })
        );
      }
    } catch (err) {
      console.error("Delete employee error:", err);
      const msg = err.message || "An unexpected error occurred while deleting employee.";
      setErrorMessage(msg);
      dispatch(
        addNotification({
          type: "error",
          message: msg,
        })
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Delete Employee?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm employee profile removal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 font-medium">
            Are you sure you want to delete this employee? You are about to delete:
          </p>

          {/* Employee Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-900">{employee.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Employee Code:</span>
              <span className="font-mono font-bold text-slate-800">
                {employee.employeeCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-800">{employee.email}</span>
            </div>
            {employee.department?.name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{employee.department.name}</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Caution:</strong> This action cannot be undone. If linked to a system user account, the user account will remain active but unlinked.
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
