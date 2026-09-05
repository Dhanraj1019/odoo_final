import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  X,
  UserCheck,
  Shield,
  User,
  Mail,
  Lock,
  Building2,
  AlertCircle,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
} from "lucide-react";
import usersApi from "../../../api/users";
import employeesApi from "../../../api/employees";
import { ROLES } from "../../../lib/constants";
import { addNotification } from "../../notifications/notificationSlice";

const ALL_ROLES = [
  { id: ROLES.ADMIN, label: "Admin", desc: "Full administrative & system access", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: ROLES.HR_MANAGER, label: "HR Manager", desc: "Workforce, attendance & time off operations", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: ROLES.HR_PAYROLL_MANAGER, label: "HR Payroll Manager", desc: "Full payroll lifecycle, payruns & configuration", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: ROLES.HR_PAYROLL_USER, label: "HR Payroll User", desc: "Payrun execution & read-only configuration", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: ROLES.EMPLOYEE, label: "Employee", desc: "Self-service profile, attendance & time off", badge: "bg-slate-50 text-slate-700 border-slate-200" },
];

export default function UserFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [employees, setEmployees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load available active employees for linking selector
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await employeesApi.listEmployees();
        if (res.ok && (res.data?.employees || res.employees)) {
          setEmployees(res.data?.employees || res.employees || []);
        }
      } catch (err) {
        console.error("Failed to load employees for user linking:", err);
      }
    }
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || "");
      setEmail(initialData.email || "");
      setPassword("");
      setSelectedRoles(Array.isArray(initialData.roles) ? initialData.roles : []);
      const empId = initialData.employee ? initialData.employee._id || initialData.employee : "";
      setEmployeeId(empId);
      setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setSelectedRoles([ROLES.EMPLOYEE]);
      setEmployeeId("");
      setIsActive(true);
    }
    setErrorMessage("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleToggleRole = (roleId) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("A valid email address is required.");
      return;
    }

    if (!isEditing && (!password || password.length < 6)) {
      setErrorMessage("Password is required and must be at least 6 characters.");
      return;
    }

    if (selectedRoles.length === 0) {
      setErrorMessage("At least one system role must be assigned.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updatePayload = {
          fullName: fullName.trim(),
          roles: selectedRoles,
          employeeId: employeeId || null,
          isActive,
        };

        const res = await usersApi.updateUser(initialData._id, updatePayload);
        if (res.ok) {
          dispatch(
            addNotification({
              type: "success",
              message: `User account "${fullName}" updated successfully.`,
            })
          );
          onSuccess?.();
          onClose();
        } else {
          setErrorMessage(res.message || "Failed to update user account.");
        }
      } else {
        const createPayload = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          roles: selectedRoles,
          employeeId: employeeId || null,
        };

        const res = await usersApi.createUser(createPayload);
        if (res.ok) {
          dispatch(
            addNotification({
              type: "success",
              message: `User account "${fullName}" created successfully.`,
            })
          );
          onSuccess?.();
          onClose();
        } else if (res.message && res.message.toLowerCase().includes("already exists")) {
          setErrorMessage("An account with this email already exists.");
        } else {
          setErrorMessage(res.message || "Failed to create user account.");
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit User Account" : "Provision New User Account"}
              </h2>
              <p className="text-xs text-slate-500">Configure credentials, roles, and employee linkage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@peoplepay360.local"
                  disabled={isEditing}
                  className={`w-full text-xs font-medium pl-9 pr-3.5 py-2.5 border rounded-xl focus:outline-hidden transition-all ${
                    isEditing
                      ? "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  }`}
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Password (Only on Create) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs font-medium pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  required
                  minLength={6}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Multi-Role Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                System Role Assignment <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {selectedRoles.length} {selectedRoles.length === 1 ? "role" : "roles"} selected
              </span>
            </div>

            <div className="space-y-2 border border-slate-200/80 rounded-2xl p-3 bg-slate-50/40">
              {ALL_ROLES.map((role) => {
                const isChecked = selectedRoles.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isChecked
                        ? "bg-indigo-50/60 border-indigo-200/80 shadow-2xs"
                        : "bg-white border-slate-200/70 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRole(role.id)}
                      className="hidden"
                    />
                    <div className="mt-0.5 text-indigo-600">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{role.label}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${role.badge}`}>
                          {role.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{role.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Linked Employee Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Link to Master Employee Record <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="">-- No Linked Employee (Administrative User) --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeCode || "No Code"}) — {emp.department?.name || "General"}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Linking attaches Employee Self-Service data (attendance logs, leave allocations, payslips) to this login.
            </p>
          </div>

          {/* Active Status (Only in Edit mode) */}
          {isEditing && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Account Active Status</span>
                <p className="text-[11px] text-slate-500">Disabled accounts cannot log into PeoplePay360</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
