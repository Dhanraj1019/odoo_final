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
  Briefcase,
  Calendar,
  CreditCard,
  Phone,
  Hash,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  UserX,
  RotateCcw,
  Sparkles,
  UserPlus,
  Loader2,
} from "lucide-react";
import usersApi from "../../../api/users";
import employeesApi from "../../../api/employees";
import referencesApi from "../../../api/references";
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

  // Top Mode Selector: "existingUser" | "manual" (Default: "existingUser")
  const [creationMode, setCreationMode] = useState("existingUser");

  // Mode 1: Search Existing User State
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [isAlreadyEmployee, setIsAlreadyEmployee] = useState(false);
  const [linkedEmployee, setLinkedEmployee] = useState(null);
  const [hasInconsistency, setHasInconsistency] = useState(false);
  const [inconsistencyMsg, setInconsistencyMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Manual Mode Conflict State
  const [manualConflictEmployee, setManualConflictEmployee] = useState(null);

  // User Account Setup State (Mode 1 & Edit)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([ROLES.EMPLOYEE]);
  const [isActive, setIsActive] = useState(true);

  // Mode 2: Manual Employee Form State
  const [manualTab, setManualTab] = useState("general"); // 'general' | 'organization' | 'bank'
  const [manualFullName, setManualFullName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [manualConfirmPassword, setManualConfirmPassword] = useState("");
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [showManualConfirmPassword, setShowManualConfirmPassword] = useState(false);
  const [manualDepartment, setManualDepartment] = useState("");
  const [manualJobPosition, setManualJobPosition] = useState("");
  const [manualManager, setManualManager] = useState("");
  const [manualWorkingSchedule, setManualWorkingSchedule] = useState("");
  const [manualEmployeeType, setManualEmployeeType] = useState("Full-Time");
  const [manualStatus, setManualStatus] = useState("Active");
  const [manualDateOfJoining, setManualDateOfJoining] = useState(new Date().toISOString().slice(0, 10));
  const [manualBankName, setManualBankName] = useState("");
  const [manualAccountNumber, setManualAccountNumber] = useState("");
  const [manualIfsc, setManualIfsc] = useState("");

  // Reference Data for Manual Dropdowns
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [workingSchedules, setWorkingSchedules] = useState([]);
  const [candidateEmployees, setCandidateEmployees] = useState([]);

  // Status & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchError, setSearchError] = useState("");

  // Load Reference Data
  useEffect(() => {
    async function loadRefs() {
      try {
        const [deptRes, jpRes, schRes, empRes] = await Promise.all([
          referencesApi.listDepartments().catch(() => ({ ok: false })),
          referencesApi.listJobPositions().catch(() => ({ ok: false })),
          referencesApi.listWorkingSchedules().catch(() => ({ ok: false })),
          employeesApi.listEmployees().catch(() => ({ ok: false })),
        ]);

        if (deptRes?.ok && (deptRes.data?.departments || deptRes.departments)) {
          setDepartments(deptRes.data?.departments || deptRes.departments || []);
        }
        if (jpRes?.ok && (jpRes.data?.jobPositions || jpRes.jobPositions)) {
          setJobPositions(jpRes.data?.jobPositions || jpRes.jobPositions || []);
        }
        if (schRes?.ok && (schRes.data?.workingSchedules || schRes.workingSchedules)) {
          setWorkingSchedules(schRes.data?.workingSchedules || schRes.workingSchedules || []);
        }
        if (empRes?.ok && (empRes.data?.employees || empRes.employees)) {
          setCandidateEmployees(empRes.data?.employees || empRes.employees || []);
        }
      } catch (err) {
        console.error("Failed to load reference data for modal:", err);
      }
    }

    if (isOpen) {
      loadRefs();
    }
  }, [isOpen]);

  // Reset form on open / initialData change
  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSearchError("");
      setSearchEmail("");
      setFoundUser(null);
      setIsAlreadyEmployee(false);
      setLinkedEmployee(null);
      setHasInconsistency(false);
      setInconsistencyMsg("");
      setManualConflictEmployee(null);
      setHasSearched(false);
      setManualTab("general");

      if (initialData) {
        setCreationMode("existingUser");
        setFullName(initialData.fullName || "");
        setEmail(initialData.email || "");
        setPassword("");
        setSelectedRoles(Array.isArray(initialData.roles) ? initialData.roles : [ROLES.EMPLOYEE]);
        setSelectedUser(initialData);
        setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
      } else {
        setCreationMode("existingUser");
        setFullName("");
        setEmail("");
        setPassword("");
        setSelectedRoles([ROLES.EMPLOYEE]);
        setSelectedUser(null);
        setIsActive(true);

        // Reset manual employee fields
        setManualFullName("");
        setManualEmail("");
        setManualPhone("");
        setManualPassword("");
        setManualConfirmPassword("");
        setShowManualPassword(false);
        setShowManualConfirmPassword(false);
        setManualDepartment("");
        setManualJobPosition("");
        setManualManager("");
        setManualWorkingSchedule("");
        setManualEmployeeType("Full-Time");
        setManualStatus("Active");
        setManualDateOfJoining(new Date().toISOString().slice(0, 10));
        setManualBankName("");
        setManualAccountNumber("");
        setManualIfsc("");
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Mode Switch Handler without modifying database
  const handleSwitchMode = (mode, prefillEmail = "") => {
    if (creationMode === mode && !prefillEmail) return;
    setCreationMode(mode);
    setErrorMessage("");
    setSearchError("");
    setFoundUser(null);
    setIsAlreadyEmployee(false);
    setLinkedEmployee(null);
    setHasInconsistency(false);
    setInconsistencyMsg("");
    setManualConflictEmployee(null);
    setHasSearched(false);
    setSelectedUser(null);

    if (mode === "manual") {
      setManualFullName("");
      setManualEmail(prefillEmail || "");
      setManualPassword("");
      setManualConfirmPassword("");
    } else if (mode === "existingUser") {
      setSearchEmail(prefillEmail || "");
    }
  };

  // Search User in User Collection (Read Only)
  const handleSearchUser = async (e) => {
    if (e) e.preventDefault();
    setSearchError("");
    setErrorMessage("");
    setFoundUser(null);
    setIsAlreadyEmployee(false);
    setLinkedEmployee(null);
    setHasInconsistency(false);
    setInconsistencyMsg("");
    setHasSearched(false);

    const trimmed = searchEmail.trim();
    if (!trimmed) {
      setSearchError("Please enter an email address.");
      return;
    }

    if (!trimmed.includes("@") || trimmed.length < 5 || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setSearchError("Enter a valid email address.");
      return;
    }

    const normalized = trimmed.toLowerCase();
    setIsSearching(true);
    try {
      const res = await usersApi.lookupUserByEmail(normalized);
      setHasSearched(true);
      if (res.ok && res.status === "EMPLOYEE_LINK_INCONSISTENCY") {
        setHasInconsistency(true);
        setInconsistencyMsg(
          res.message ||
            "This user has an existing employee relationship that appears inconsistent. Please review the employee records before creating another employee."
        );
        setFoundUser(res.user || null);
        setIsAlreadyEmployee(true);
      } else if (res.ok && (res.status === "ALREADY_EMPLOYEE" || res.isAlreadyEmployee)) {
        setFoundUser(res.user || res.data?.user);
        setIsAlreadyEmployee(true);
        setLinkedEmployee(res.employee || res.linkedEmployee || res.data?.employee || res.data?.linkedEmployee || null);
      } else if (res.ok && res.found && res.user) {
        setFoundUser(res.user);
        setIsAlreadyEmployee(false);
        setLinkedEmployee(null);
      } else if (res.ok && !res.found) {
        setFoundUser(null);
        setIsAlreadyEmployee(false);
        setLinkedEmployee(null);
      } else {
        setSearchError("Unable to complete the search. Please check your connection and try again.");
      }
    } catch (err) {
      console.error("User search failed:", err);
      setSearchError("Unable to complete the search. Please check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (usr) => {
    setSelectedUser(usr);
    setFullName(usr.fullName || "");
    setEmail(usr.email || "");
    setSelectedRoles(Array.isArray(usr.roles) && usr.roles.length > 0 ? usr.roles : [ROLES.EMPLOYEE]);
    setIsActive(usr.isActive !== undefined ? usr.isActive : true);
    setErrorMessage("");
    setManualConflictEmployee(null);
  };

  const handleResetUserSelection = () => {
    setSelectedUser(null);
    setFoundUser(null);
    setIsAlreadyEmployee(false);
    setLinkedEmployee(null);
    setHasInconsistency(false);
    setInconsistencyMsg("");
    setHasSearched(false);
    setFullName("");
    setEmail("");
    setErrorMessage("");
  };

  const handleToggleRole = (roleId) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // Submit Handler for Both Modes
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions
    setErrorMessage("");
    setManualConflictEmployee(null);

    setIsSubmitting(true);
    try {
      if (creationMode === "manual" && !isEditing) {
        // --- MANUAL EMPLOYEE CREATION ---
        if (!manualFullName.trim()) {
          setErrorMessage("Full name is required.");
          setIsSubmitting(false);
          return;
        }
        if (!manualEmail.trim() || !manualEmail.includes("@") || !/^\S+@\S+\.\S+$/.test(manualEmail.trim())) {
          setErrorMessage("A valid work email address is required.");
          setIsSubmitting(false);
          return;
        }
        if (!manualPassword) {
          setErrorMessage("Password is required.");
          setIsSubmitting(false);
          return;
        }
        if (manualPassword.length < 8) {
          setErrorMessage("Password must contain at least 8 characters.");
          setIsSubmitting(false);
          return;
        }
        if (!manualConfirmPassword) {
          setErrorMessage("Please confirm the password.");
          setIsSubmitting(false);
          return;
        }
        if (manualPassword !== manualConfirmPassword) {
          setErrorMessage("Passwords do not match.");
          setIsSubmitting(false);
          return;
        }

        const employeePayload = {
          fullName: manualFullName.trim(),
          email: manualEmail.trim().toLowerCase(),
          password: manualPassword,
          phone: manualPhone.trim(),
          department: manualDepartment || null,
          jobPosition: manualJobPosition || null,
          manager: manualManager || null,
          workingSchedule: manualWorkingSchedule || null,
          employeeType: manualEmployeeType || "Full-Time",
          status: manualStatus || "Active",
          dateOfJoining: manualDateOfJoining || null,
          bankDetails: {
            accountNumber: manualAccountNumber.trim(),
            ifscOrRoutingCode: manualIfsc.trim(),
            bankName: manualBankName.trim(),
          },
        };

        const res = await employeesApi.createEmployee(employeePayload);
        if (res.ok && (res.success || res.data?.employee)) {
          dispatch(
            addNotification({
              type: "success",
              message: `Employee "${manualFullName}" and login account created successfully.`,
            })
          );
          onSuccess?.();
          onClose();
        } else if (res.code === "USER_EMAIL_EXISTS") {
          const msg = res.message || "A user account with this email already exists. Please use 'Find Existing User' instead.";
          setErrorMessage(msg);
          dispatch(addNotification({ type: "error", message: msg }));
        } else if (res.code === "EMPLOYEE_EMAIL_EXISTS" || res.status === 409) {
          const msg = res.message || "An employee already exists with this email.";
          setErrorMessage(msg);
          if (res.employee) {
            setManualConflictEmployee(res.employee);
          }
          dispatch(addNotification({ type: "error", message: msg }));
        } else {
          setErrorMessage(res.message || res.error || "Failed to create employee.");
        }
      } else {
        // --- USER ACCOUNT MANAGEMENT / CREATION ---
        if (!selectedUser && !isEditing) {
          setErrorMessage("Please search and select a user account first.");
          setIsSubmitting(false);
          return;
        }

        if (!fullName.trim()) {
          setErrorMessage("Full name is required.");
          setIsSubmitting(false);
          return;
        }

        if (selectedRoles.length === 0) {
          setErrorMessage("At least one system role must be assigned.");
          setIsSubmitting(false);
          return;
        }

        const targetUserId = isEditing ? initialData?._id : selectedUser?._id;
        if (targetUserId) {
          const updatePayload = {
            fullName: fullName.trim(),
            roles: selectedRoles,
            isActive,
          };

          const res = await usersApi.updateUser(targetUserId, updatePayload);
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
          if (!password || password.length < 8) {
            setErrorMessage("Password is required and must contain at least 8 characters.");
            setIsSubmitting(false);
            return;
          }

          const createPayload = {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,
            roles: selectedRoles,
          };

          const res = await usersApi.createUser(createPayload);
          if (res.ok) {
            dispatch(
              addNotification({
                type: "success",
                message: `User account for "${fullName}" provisioned successfully.`,
              })
            );
            onSuccess?.();
            onClose();
          } else if (res.message && res.message.toLowerCase().includes("already exists")) {
            setErrorMessage("A user account already exists with this email address.");
          } else {
            setErrorMessage(res.message || "Unable to create the user account. Please try again.");
          }
        }
      }
    } catch (err) {
      setErrorMessage(err.message || "Unable to save record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobPositions = manualDepartment
    ? jobPositions.filter((jp) => !jp.department || (jp.department._id || jp.department) === manualDepartment)
    : jobPositions;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit User Account" : "Add / Manage User Account"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Modify canonical roles, status, and permissions"
                  : "Choose between linking an existing user or creating a manual employee entry."}
              </p>
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

        {/* TOP MODE SELECTOR TABS: Clearly visible on open (Create Mode only) */}
        {!isEditing && (
          <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Find Existing User */}
              <button
                type="button"
                onClick={() => handleSwitchMode("existingUser")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  creationMode === "existingUser"
                    ? "bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creationMode === "existingUser"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  }`}
                >
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Find Existing User</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Search a registered system user by email
                  </p>
                </div>
              </button>

              {/* Option 2: Manual Employee Entry */}
              <button
                type="button"
                onClick={() => handleSwitchMode("manual")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  creationMode === "manual"
                    ? "bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creationMode === "manual"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Manual Employee Entry</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Create an employee and system login account
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* General Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {errorMessage.includes("Find Existing User") && (
                <button
                  type="button"
                  onClick={() => handleSwitchMode("existingUser", manualEmail.trim().toLowerCase())}
                  className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Switch to Find Existing User</span>
                </button>
              )}
              {manualConflictEmployee && (
                <div className="mt-2 p-3 bg-white border border-rose-200/80 rounded-xl text-xs space-y-1 text-slate-700 shadow-2xs">
                  <p className="font-bold text-slate-900">{manualConflictEmployee.fullName || manualConflictEmployee.name}</p>
                  <p className="text-[11px] text-slate-500">{manualConflictEmployee.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-medium text-slate-600">
                    {manualConflictEmployee.employeeCode && (
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono font-bold">
                        ID: {manualConflictEmployee.employeeCode}
                      </span>
                    )}
                    {manualConflictEmployee.department && (
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                        Dept: {typeof manualConflictEmployee.department === "object" ? manualConflictEmployee.department?.name : manualConflictEmployee.department}
                      </span>
                    )}
                    {manualConflictEmployee.status && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">
                        {manualConflictEmployee.status}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* OPTION 1: FIND EXISTING USER FLOW                                         */}
          {/* ========================================================================= */}
          {(!isEditing && creationMode === "existingUser" && !selectedUser) && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Step 1 — Search User
                  </label>
                  <span className="text-[11px] text-slate-400">Search User collection by email</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => {
                        setSearchEmail(e.target.value);
                        setSearchError("");
                        setHasSearched(false);
                        setFoundUser(null);
                        setIsAlreadyEmployee(false);
                        setLinkedEmployee(null);
                        setHasInconsistency(false);
                        setInconsistencyMsg("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchUser();
                        }
                      }}
                      placeholder="Enter user email address (e.g. nishu@gmail.com)..."
                      className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchUser}
                    disabled={isSearching}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Search className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
                    <span>{isSearching ? "Searching..." : "Search User"}</span>
                  </button>
                </div>

                {searchError && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{searchError}</span>
                  </p>
                )}
              </div>

              {/* Searching Loading State */}
              {isSearching && (
                <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-2 text-slate-500">
                  <Search className="w-5 h-5 animate-spin text-indigo-600" />
                  <p className="text-xs font-bold text-slate-700">Searching user directory...</p>
                  <p className="text-[11px] text-slate-400">Querying User collection by email</p>
                </div>
              )}

              {/* Search Result: User Found & Available */}
              {!isSearching && hasSearched && foundUser && !isAlreadyEmployee && !hasInconsistency && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Registered User Found
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        foundUser.isActive !== false
                          ? "bg-emerald-100/80 text-emerald-800"
                          : "bg-rose-100/80 text-rose-800"
                      }`}
                    >
                      {foundUser.isActive !== false ? "Active Account" : "Disabled Account"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {foundUser.fullName?.slice(0, 2).toUpperCase() || "US"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{foundUser.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{foundUser.email}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {(foundUser.roles || []).map((r, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectUser(foundUser)}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Select This User</span>
                  </button>
                </div>
              )}

              {/* Search Result: User Found But Already an Employee */}
              {!isSearching && hasSearched && foundUser && isAlreadyEmployee && !hasInconsistency && (
                <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Already an Employee
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900">
                      Linked Record
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm shrink-0">
                        {foundUser.fullName?.slice(0, 2).toUpperCase() || "US"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{foundUser.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{foundUser.email}</p>
                        <p className="text-[11px] text-amber-800 mt-1 font-medium">
                          This user is already linked to an employee record. No duplicate employee record can be created.
                        </p>
                      </div>
                    </div>

                    {linkedEmployee && (
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID</span>
                          <span className="font-mono font-bold text-slate-800">{linkedEmployee.employeeCode || linkedEmployee.employeeId || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                          <span className="font-medium text-slate-800">{typeof linkedEmployee.department === "object" ? linkedEmployee.department?.name : (linkedEmployee.department || "—")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                          <span className="font-bold text-emerald-700">{linkedEmployee.status || "Active"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold shadow-none cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Already Added as Employee</span>
                  </button>
                </div>
              )}

              {/* Case D: Data Inconsistency Warning */}
              {!isSearching && hasSearched && hasInconsistency && (
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Employee account data requires administrator review</span>
                  </div>
                  <p className="text-xs text-rose-700 bg-white p-3 rounded-xl border border-rose-100 leading-relaxed">
                    {inconsistencyMsg ||
                      "This user has an existing employee relationship that appears inconsistent. Please review the employee records before creating another employee."}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold shadow-none cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Creation Locked — Review Required</span>
                  </button>
                </div>
              )}

              {/* Search Result: User Not Found */}
              {!isSearching && hasSearched && !foundUser && (
                <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div className="text-xs flex-1">
                      <p className="font-bold text-amber-900">No registered user was found with this email.</p>
                      <p className="text-amber-700 mt-0.5 text-[11px]">
                        You can create an employee record directly without a registered user account.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode("manual", searchEmail.trim().toLowerCase())}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Employee Manually</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* USER ACCOUNT SETUP / EDIT (Shown after user selection or in Edit mode)     */}
          {/* ========================================================================= */}
          {(isEditing || (creationMode === "existingUser" && selectedUser)) && (
            <div className="space-y-4">
              {/* Selected User Header Card */}
              {!isEditing && selectedUser && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      Selected User Account
                    </span>
                    <button
                      type="button"
                      onClick={handleResetUserSelection}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Change User</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                      {selectedUser.fullName?.slice(0, 2).toUpperCase() || "US"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{selectedUser.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Identity Details */}
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
                      placeholder="Full name"
                      className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-slate-400 font-normal">(System ID)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 border rounded-xl bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* System Role Assignment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
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

              {/* Active Status Toggle */}
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* OPTION 2: MANUAL EMPLOYEE ENTRY FORM                                      */}
          {/* ========================================================================= */}
          {(!isEditing && creationMode === "manual") && (
            <div className="space-y-4">
              {/* Form Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white gap-6">
                <button
                  type="button"
                  onClick={() => setManualTab("general")}
                  className={`py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    manualTab === "general"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setManualTab("organization")}
                  className={`py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    manualTab === "organization"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Organization & Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setManualTab("bank")}
                  className={`py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    manualTab === "bank"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Bank & Compensation
                </button>
              </div>

              {/* Tab 1: Basic Info */}
              {manualTab === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualFullName}
                        onChange={(e) => setManualFullName(e.target.value)}
                        placeholder="e.g. Johnathan Doe"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="employee@company.com"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showManualPassword ? "text" : "password"}
                          value={manualPassword}
                          onChange={(e) => setManualPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full text-xs font-medium pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowManualPassword(!showManualPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showManualPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showManualConfirmPassword ? "text" : "password"}
                          value={manualConfirmPassword}
                          onChange={(e) => setManualConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full text-xs font-medium pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowManualConfirmPassword(!showManualConfirmPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showManualConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Date of Joining */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        value={manualDateOfJoining}
                        onChange={(e) => setManualDateOfJoining(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Organization & Schedule */}
              {manualTab === "organization" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Department */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Department
                      </label>
                      <select
                        value={manualDepartment}
                        onChange={(e) => setManualDepartment(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Job Position
                      </label>
                      <select
                        value={manualJobPosition}
                        onChange={(e) => setManualJobPosition(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      >
                        <option value="">— Select Job Position —</option>
                        {filteredJobPositions.map((pos) => (
                          <option key={pos._id} value={pos._id}>
                            {pos.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Manager */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Direct Manager
                      </label>
                      <select
                        value={manualManager}
                        onChange={(e) => setManualManager(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      >
                        <option value="">— No Manager (Top Level) —</option>
                        {candidateEmployees.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.fullName} ({m.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Working Schedule */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Working Schedule
                      </label>
                      <select
                        value={manualWorkingSchedule}
                        onChange={(e) => setManualWorkingSchedule(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      >
                        <option value="">— Select Schedule —</option>
                        {workingSchedules.map((sch) => (
                          <option key={sch._id} value={sch._id}>
                            {sch.name} {sch.company ? `(${sch.company})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Employment Type
                      </label>
                      <select
                        value={manualEmployeeType}
                        onChange={(e) => setManualEmployeeType(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Workforce Status
                      </label>
                      <select
                        value={manualStatus}
                        onChange={(e) => setManualStatus(e.target.value)}
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
              {manualTab === "bank" && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p>
                      Bank details are utilized for automated payroll disbursements and payslip generation.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={manualBankName}
                        onChange={(e) => setManualBankName(e.target.value)}
                        placeholder="e.g. JPMorgan Chase / State Bank of India"
                        className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={manualAccountNumber}
                          onChange={(e) => setManualAccountNumber(e.target.value)}
                          placeholder="e.g. 987654321012"
                          className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          IFSC / Routing / Swift Code
                        </label>
                        <input
                          type="text"
                          value={manualIfsc}
                          onChange={(e) => setManualIfsc(e.target.value)}
                          placeholder="e.g. SBIN0001234 / 021000021"
                          className="w-full text-xs font-mono uppercase px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ACTION FOOTER                                                             */}
          {/* ========================================================================= */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* In Existing User Search Mode: only show Submit button once a user is selected */}
            {(isEditing || (creationMode === "existingUser" && selectedUser)) && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Save User Account"}
              </button>
            )}

            {/* In Manual Employee Mode: show Create Employee button */}
            {(!isEditing && creationMode === "manual") && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Employee...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Create Employee</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
