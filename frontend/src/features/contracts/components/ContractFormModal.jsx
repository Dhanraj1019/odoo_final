import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  FileText,
  User,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import contractsApi from "../../../api/contracts";
import { addNotification } from "../../notifications/notificationSlice";

const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    const match = dateVal.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

export default function ContractFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  preselectedEmployeeId = "",
  onSuccess,
  employees = [],
  departments = [],
  jobPositions = [],
  salaryStructures = [],
  workingSchedules = [],
  isLoadingStructures = false,
  structuresError = "",
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prevEmployeeId, setPrevEmployeeId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      contractReference: "",
      employee: "",
      department: "",
      jobPosition: "",
      startDate: "",
      endDate: "",
      wagePerMonth: "",
      salaryStructure: "",
      workingSchedule: "",
      status: "Draft",
    },
  });

  const selectedEmployeeId = watch("employee");

  // Populate form on modal open or when initialData changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      clearErrors();
      if (initialData && initialData._id) {
        const empId = initialData.employee?._id || initialData.employee || "";
        const deptId = initialData.department?._id || initialData.department || "";
        const posId = initialData.jobPosition?._id || initialData.jobPosition || "";
        const strId = initialData.salaryStructure?._id || initialData.salaryStructure || "";
        const schId = initialData.workingSchedule?._id || initialData.workingSchedule || "";

        setPrevEmployeeId(empId);

        reset({
          contractReference: initialData.contractReference || "",
          employee: empId,
          department: deptId,
          jobPosition: posId,
          startDate: formatDateForInput(initialData.startDate),
          endDate: formatDateForInput(initialData.endDate),
          wagePerMonth: initialData.wagePerMonth != null ? initialData.wagePerMonth : "",
          salaryStructure: strId,
          workingSchedule: schId,
          status: initialData.status || "Draft",
        });
      } else {
        const empId = preselectedEmployeeId || "";
        setPrevEmployeeId(empId);

        reset({
          contractReference: "",
          employee: empId,
          department: "",
          jobPosition: "",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: "",
          wagePerMonth: "",
          salaryStructure: "",
          workingSchedule: "",
          status: "Draft",
        });
      }
    }
  }, [isOpen, initialData, preselectedEmployeeId, reset, clearErrors]);

  // Auto-fill employee's department and job position when selecting a different employee
  useEffect(() => {
    if (isOpen && selectedEmployeeId && selectedEmployeeId !== prevEmployeeId) {
      const emp = employees.find((e) => e._id === selectedEmployeeId);
      if (emp) {
        if (emp.department?._id || emp.department) {
          setValue("department", emp.department._id || emp.department);
        }
        if (emp.jobPosition?._id || emp.jobPosition) {
          setValue("jobPosition", emp.jobPosition._id || emp.jobPosition);
        }
        if (emp.workingSchedule?._id || emp.workingSchedule) {
          setValue("workingSchedule", emp.workingSchedule._id || emp.workingSchedule);
        }
        if (emp.wage && !isEditing) {
          setValue("wagePerMonth", emp.wage);
        }
      }
      setPrevEmployeeId(selectedEmployeeId);
    }
  }, [selectedEmployeeId, prevEmployeeId, isOpen, employees, setValue, isEditing]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        contractReference: formData.contractReference ? formData.contractReference.trim() : "",
        employee: formData.employee,
        department: formData.department || null,
        jobPosition: formData.jobPosition || null,
        startDate: formData.startDate,
        endDate: formData.endDate ? formData.endDate : null,
        wagePerMonth: Number(formData.wagePerMonth),
        salaryStructure: formData.salaryStructure || null,
        workingSchedule: formData.workingSchedule || null,
        status: formData.status || "Draft",
      };

      let res;
      if (isEditing) {
        res = await contractsApi.updateContract(initialData._id, payload);
      } else {
        res = await contractsApi.createContract(payload);
      }

      if (res.ok && (res.success || res.data?.contract || res.contract)) {
        const saved = res.data?.contract || res.contract;
        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? `Contract "${saved.contractReference}" updated successfully.`
              : `Contract "${saved.contractReference}" created successfully.`,
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to save contract";
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Contract — ${initialData?.contractReference || "Reference"}` : "New Employment Contract"}
              </h2>
              <p className="text-xs text-slate-500">
                Define compensation terms, validity periods, and wage structures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Contract Validation Conflict</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Selector */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("employee", { required: "Employee is required" })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.employee
                      ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                >
                  <option value="">— Select Employee —</option>
                  {initialData?.employee && !employees.some((e) => e._id === (initialData.employee?._id || initialData.employee)) && (
                    <option value={initialData.employee._id || initialData.employee}>
                      {initialData.employee.fullName || "Current Employee"} ({initialData.employee.employeeCode || ""})
                    </option>
                  )}
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.employeeCode}) — {emp.email}
                    </option>
                  ))}
                </select>
                {errors.employee && (
                  <p className="text-xs text-rose-600">{errors.employee.message}</p>
                )}
              </div>

              {/* Contract Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contract Reference
                </label>
                <input
                  type="text"
                  {...register("contractReference")}
                  placeholder="Auto-generated (e.g. CON/2026/0001)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <span className="text-[11px] text-slate-400">Leave blank to auto-generate</span>
              </div>

              {/* Contract Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contract Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    {...register("startDate", { required: "Start date is required" })}
                    className={`w-full pl-9 pr-3.5 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.startDate
                        ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-rose-600">{errors.startDate.message}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    {...register("endDate")}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-400">Leave blank for open-ended contract</span>
              </div>

              {/* Monthly Wage */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Monthly Wage (Gross Base) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("wagePerMonth", {
                      required: "Monthly wage is required",
                      min: { value: 0, message: "Wage cannot be negative" },
                    })}
                    placeholder="e.g. 5000.00"
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 transition-all ${
                      errors.wagePerMonth
                        ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                    }`}
                  />
                </div>
                {errors.wagePerMonth && (
                  <p className="text-xs text-rose-600">{errors.wagePerMonth.message}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department
                </label>
                <select
                  {...register("department")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">— Select Department —</option>
                  {initialData?.department && !departments.some((d) => d._id === (initialData.department?._id || initialData.department)) && (
                    <option value={initialData.department._id || initialData.department}>
                      {initialData.department.name || "Current Department"}
                    </option>
                  )}
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Job Position
                </label>
                <select
                  {...register("jobPosition")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">— Select Job Position —</option>
                  {initialData?.jobPosition && !jobPositions.some((p) => p._id === (initialData.jobPosition?._id || initialData.jobPosition)) && (
                    <option value={initialData.jobPosition._id || initialData.jobPosition}>
                      {initialData.jobPosition.name || "Current Job Position"}
                    </option>
                  )}
                  {jobPositions.map((pos) => (
                    <option key={pos._id} value={pos._id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Structure */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Salary Structure
                  </label>
                  {isLoadingStructures && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Loading...
                    </span>
                  )}
                </div>
                <select
                  {...register("salaryStructure")}
                  disabled={isLoadingStructures || (salaryStructures.length === 0 && !initialData?.salaryStructure)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoadingStructures ? (
                    <option value="">Loading salary structures...</option>
                  ) : salaryStructures.length === 0 && !initialData?.salaryStructure ? (
                    <option value="" disabled>
                      No salary structures available. Create a salary structure first.
                    </option>
                  ) : (
                    <>
                      <option value="">— Select Salary Structure —</option>
                      {initialData?.salaryStructure && !salaryStructures.some((s) => (s._id || s.id) === (initialData.salaryStructure?._id || initialData.salaryStructure)) && (
                        <option value={initialData.salaryStructure._id || initialData.salaryStructure}>
                          {initialData.salaryStructure.name || "Current Salary Structure"}
                        </option>
                      )}
                      {salaryStructures.map((str) => (
                        <option key={str._id || str.id} value={str._id || str.id}>
                          {str.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {structuresError ? (
                  <p className="text-[11px] text-rose-600 font-medium">{structuresError}</p>
                ) : !isLoadingStructures && salaryStructures.length === 0 && !initialData?.salaryStructure ? (
                  <p className="text-[11px] text-amber-600 font-medium">
                    No salary structures available. Create a salary structure first.
                  </p>
                ) : null}
              </div>

              {/* Working Schedule (Optional Contract Override) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Working Schedule Override
                </label>
                <select
                  {...register("workingSchedule")}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">— Use Employee Default Schedule —</option>
                  {initialData?.workingSchedule && !workingSchedules.some((w) => w._id === (initialData.workingSchedule?._id || initialData.workingSchedule)) && (
                    <option value={initialData.workingSchedule._id || initialData.workingSchedule}>
                      {initialData.workingSchedule.name || "Current Working Schedule"}
                    </option>
                  )}
                  {workingSchedules.map((sch) => (
                    <option key={sch._id} value={sch._id}>
                      {sch.name} ({(sch.totalWeeklyHours || 0).toFixed(1)} hrs/wk)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Contract...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Contract Changes" : "Create Contract"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
