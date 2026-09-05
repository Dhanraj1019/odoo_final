import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  X,
  User,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";

export default function EmployeeFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  onSuccess,
  departments = [],
  jobPositions = [],
  workingSchedules = [],
  candidateEmployees = [],
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'organization' | 'bank'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      employeeCode: "",
      email: "",
      phone: "",
      department: "",
      jobPosition: "",
      manager: "",
      workingSchedule: "",
      employeeType: "Full-Time",
      status: "Active",
      dateOfJoining: "",
      bankDetails: {
        accountNumber: "",
        ifscOrRoutingCode: "",
        bankName: "",
      },
    },
  });

  const selectedDepartment = watch("department");

  // Filter job positions by selected department if applicable
  const filteredPositions = selectedDepartment
    ? jobPositions.filter(
        (jp) => !jp.department || (jp.department._id || jp.department) === selectedDepartment
      )
    : jobPositions;

  // Filter candidate managers: exclude terminated employees and exclude self when editing
  const eligibleManagers = candidateEmployees.filter((emp) => {
    if (emp.status === "Terminated") return false;
    if (isEditing && emp._id === initialData._id) return false;
    return true;
  });

  // Populate form on open or initialData change
  useEffect(() => {
    if (isOpen) {
      setSubmitError("");
      setActiveTab("general");
      if (initialData) {
        reset({
          fullName: initialData.fullName || "",
          employeeCode: initialData.employeeCode || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          department: initialData.department?._id || initialData.department || "",
          jobPosition: initialData.jobPosition?._id || initialData.jobPosition || "",
          manager: initialData.manager?._id || initialData.manager || "",
          workingSchedule: initialData.workingSchedule?._id || initialData.workingSchedule || "",
          employeeType: initialData.employeeType || "Full-Time",
          status: initialData.status || "Active",
          dateOfJoining: initialData.dateOfJoining
            ? new Date(initialData.dateOfJoining).toISOString().slice(0, 10)
            : "",
          bankDetails: {
            accountNumber: initialData.bankDetails?.accountNumber || "",
            ifscOrRoutingCode: initialData.bankDetails?.ifscOrRoutingCode || "",
            bankName: initialData.bankDetails?.bankName || "",
          },
        });
      } else {
        reset({
          fullName: "",
          employeeCode: "",
          email: "",
          phone: "",
          department: "",
          jobPosition: "",
          manager: "",
          workingSchedule: workingSchedules[0]?._id || "",
          employeeType: "Full-Time",
          status: "Active",
          dateOfJoining: new Date().toISOString().slice(0, 10),
          bankDetails: {
            accountNumber: "",
            ifscOrRoutingCode: "",
            bankName: "",
          },
        });
      }
    }
  }, [isOpen, initialData, reset, workingSchedules]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Clean up empty optional ObjectId strings to null
      const payload = {
        fullName: formData.fullName.trim(),
        employeeCode: formData.employeeCode.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || "",
        department: formData.department || null,
        jobPosition: formData.jobPosition || null,
        manager: formData.manager || null,
        workingSchedule: formData.workingSchedule || null,
        employeeType: formData.employeeType || "Full-Time",
        status: formData.status || "Active",
        dateOfJoining: formData.dateOfJoining || null,
        bankDetails: {
          accountNumber: formData.bankDetails?.accountNumber?.trim() || "",
          ifscOrRoutingCode: formData.bankDetails?.ifscOrRoutingCode?.trim() || "",
          bankName: formData.bankDetails?.bankName?.trim() || "",
        },
      };

      let res;
      if (isEditing) {
        res = await employeesApi.updateEmployee(initialData._id, payload);
      } else {
        res = await employeesApi.createEmployee(payload);
      }

      if (res.ok && (res.success || res.data?.employee)) {
        const savedEmployee = res.data?.employee || res.employee;
        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? "Employee profile updated successfully."
              : `Employee "${savedEmployee.fullName}" created successfully.`,
          })
        );
        onSuccess(savedEmployee);
        onClose();
      } else {
        const msg = res.message || res.error || "Operation failed";
        setSubmitError(msg);
        dispatch(addNotification({ type: "error", message: msg }));
      }
    } catch (err) {
      console.error("Form submit error:", err);
      setSubmitError(err.message || "An unexpected error occurred");
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Employee — ${initialData?.fullName}` : "New Employee Master Record"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update workforce master details and configuration"
                  : "Register a new employee into the PeoplePay360 database"}
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

        {/* Form Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "general"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("organization")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "organization"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Organization & Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "bank"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Bank & Compensation
          </button>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
            {/* Tab 1: Basic Info */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("fullName", { required: "Full name is required" })}
                        placeholder="e.g. John Doe"
                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                          errors.fullName
                            ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-rose-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Employee Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Employee Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("employeeCode", {
                        required: "Employee code is required",
                        pattern: {
                          value: /^[A-Za-z0-9_-]+$/,
                          message: "Alphanumeric code only",
                        },
                      })}
                      placeholder="e.g. EMP001"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 transition-all ${
                        errors.employeeCode
                          ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      }`}
                    />
                    {errors.employeeCode && (
                      <p className="text-xs text-rose-600">{errors.employeeCode.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        {...register("email", {
                          required: "Work email is required",
                          pattern: {
                            value: /^\S+@\S+\.\S+$/,
                            message: "Enter a valid email address",
                          },
                        })}
                        placeholder="john.doe@company.com"
                        className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                          errors.email
                            ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        {...register("phone")}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Date of Joining */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Date of Joining
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        {...register("dateOfJoining")}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Organization & Schedule */}
            {activeTab === "organization" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Department
                    </label>
                    <select
                      {...register("department")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">— Select Department —</option>
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">— Select Job Position —</option>
                      {filteredPositions.map((pos) => (
                        <option key={pos._id} value={pos._id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manager */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Direct Manager
                    </label>
                    <select
                      {...register("manager")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">— No Manager (Top Level) —</option>
                      {eligibleManagers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.fullName} ({m.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Working Schedule */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Working Schedule
                    </label>
                    <select
                      {...register("workingSchedule")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">— Select Schedule —</option>
                      {workingSchedules.map((sch) => (
                        <option key={sch._id} value={sch._id}>
                          {sch.name} {sch.company ? `(${sch.company})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Employment Type
                    </label>
                    <select
                      {...register("employeeType")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Workforce Status
                    </label>
                    <select
                      {...register("status")}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Bank Details */}
            {activeTab === "bank" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                  <CreditCard className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p>
                    Bank details are utilized for direct automated payroll disbursements and statutory payslip generation.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      {...register("bankDetails.bankName")}
                      placeholder="e.g. JPMorgan Chase Bank / State Bank of India"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Account Number
                      </label>
                      <input
                        type="text"
                        {...register("bankDetails.accountNumber")}
                        placeholder="e.g. 987654321012"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        IFSC / Routing / Swift Code
                      </label>
                      <input
                        type="text"
                        {...register("bankDetails.ifscOrRoutingCode")}
                        placeholder="e.g. SBIN0001234 / 021000021"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
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

            <div className="flex items-center gap-2">
              {activeTab !== "bank" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab((curr) => (curr === "general" ? "organization" : "bank"))
                  }
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
                >
                  Next Section →
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Save Changes" : "Create Employee"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
