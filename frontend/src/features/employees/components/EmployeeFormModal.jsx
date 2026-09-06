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
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Link as LinkIcon,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import employeesApi from "../../../api/employees";
import usersApi from "../../../api/users";
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

  // Method Selection State (Create Mode only: "existing_user" | "manual")
  const [creationMethod, setCreationMethod] = useState("existing_user");

  // "Add from Existing Account" Search State
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [hasSearchedUser, setHasSearchedUser] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isAlreadyEmployee, setIsAlreadyEmployee] = useState(false);
  const [linkedEmployee, setLinkedEmployee] = useState(null);
  const [hasInconsistency, setHasInconsistency] = useState(false);
  const [inconsistencyMsg, setInconsistencyMsg] = useState("");

  // Manual Mode Password State (Create mode)
  const [manualPassword, setManualPassword] = useState("");
  const [manualConfirmPassword, setManualConfirmPassword] = useState("");
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [showManualConfirmPassword, setShowManualConfirmPassword] = useState(false);

  // Account Security State (Edit mode)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Manual Mode Conflict State
  const [manualConflictEmployee, setManualConflictEmployee] = useState(null);

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
      setSearchError("");
      setActiveTab("general");
      setSearchEmail("");
      setFoundUser(null);
      setHasSearchedUser(false);
      setSelectedUser(null);
      setIsAlreadyEmployee(false);
      setLinkedEmployee(null);
      setHasInconsistency(false);
      setInconsistencyMsg("");
      setManualConflictEmployee(null);

      // Reset manual passwords
      setManualPassword("");
      setManualConfirmPassword("");
      setShowManualPassword(false);
      setShowManualConfirmPassword(false);

      // Reset edit password state
      setIsChangingPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setPasswordError("");

      if (initialData) {
        setCreationMethod("manual");
        reset({
          fullName: initialData.fullName || "",
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
        setCreationMethod("existing_user");
        reset({
          fullName: "",
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

  // Switch creation method cleanly without database modifications
  const handleSwitchMethod = (method, prefillEmail = "") => {
    if (creationMethod === method && !prefillEmail) return;
    setCreationMethod(method);
    setSubmitError("");
    setSearchError("");
    setFoundUser(null);
    setHasSearchedUser(false);
    setSelectedUser(null);
    setIsAlreadyEmployee(false);
    setLinkedEmployee(null);
    setHasInconsistency(false);
    setInconsistencyMsg("");
    setManualConflictEmployee(null);

    setManualPassword("");
    setManualConfirmPassword("");

    if (method === "manual") {
      setValue("fullName", "");
      setValue("email", prefillEmail || "");
    } else if (method === "existing_user") {
      setSearchEmail(prefillEmail || "");
    }
  };

  // Search User by Email (Read Only)
  const handleSearchUser = async (e) => {
    if (e) e.preventDefault();
    setSearchError("");
    setSubmitError("");
    setFoundUser(null);
    setHasSearchedUser(false);
    setIsAlreadyEmployee(false);
    setLinkedEmployee(null);
    setHasInconsistency(false);
    setInconsistencyMsg("");

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
    setIsSearchingUser(true);
    try {
      const res = await usersApi.lookupUserByEmail(normalized);
      setHasSearchedUser(true);
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
      setIsSearchingUser(false);
    }
  };

  // Select User and link in form state
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setValue("fullName", user.fullName || "");
    setValue("email", user.email || "");
    setSubmitError("");
    setManualConflictEmployee(null);
  };

  // Reset user selection back to search
  const handleResetUserSelection = () => {
    setSelectedUser(null);
    setFoundUser(null);
    setHasSearchedUser(false);
    setIsAlreadyEmployee(false);
    setLinkedEmployee(null);
    setHasInconsistency(false);
    setInconsistencyMsg("");
    setValue("fullName", "");
    setValue("email", "");
  };

  const onSubmit = async (formData) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);
    setSubmitError("");
    setPasswordError("");
    setManualConflictEmployee(null);

    try {
      let finalFullName = formData.fullName.trim();
      let finalEmail = formData.email.trim().toLowerCase();

      if (!isEditing && creationMethod === "existing_user") {
        if (!selectedUser) {
          setSubmitError("Please search and select a user account first.");
          setIsSubmitting(false);
          return;
        }
        finalFullName = selectedUser.fullName;
        finalEmail = selectedUser.email.toLowerCase().trim();
      }

      if (!isEditing && creationMethod === "manual") {
        if (!manualPassword) {
          setSubmitError("Password is required for manual employee creation.");
          setIsSubmitting(false);
          return;
        }
        if (manualPassword.length < 8) {
          setSubmitError("Password must contain at least 8 characters.");
          setIsSubmitting(false);
          return;
        }
        if (!manualConfirmPassword) {
          setSubmitError("Please confirm the password.");
          setIsSubmitting(false);
          return;
        }
        if (manualPassword !== manualConfirmPassword) {
          setSubmitError("Passwords do not match.");
          setIsSubmitting(false);
          return;
        }
      }

      if (isEditing && isChangingPassword && (newPassword || confirmNewPassword)) {
        if (!newPassword || newPassword.length < 8) {
          setPasswordError("New password must contain at least 8 characters.");
          setSubmitError("Password must contain at least 8 characters.");
          setIsSubmitting(false);
          return;
        }
        if (!confirmNewPassword) {
          setPasswordError("Please confirm the new password.");
          setSubmitError("Please confirm the new password.");
          setIsSubmitting(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPasswordError("Passwords do not match.");
          setSubmitError("Passwords do not match.");
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare payload (employeeCode is auto generated by backend)
      const payload = {
        fullName: finalFullName,
        email: finalEmail,
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

      if (!isEditing && creationMethod === "manual") {
        payload.password = manualPassword;
      }

      // If created from an existing user account, attach linkUserId
      if (!isEditing && creationMethod === "existing_user" && selectedUser?._id) {
        payload.linkUserId = selectedUser._id;
      }

      let res;
      if (isEditing) {
        res = await employeesApi.updateEmployee(initialData._id, payload);
      } else {
        res = await employeesApi.createEmployee(payload);
      }

      if (res.ok && (res.success || res.data?.employee)) {
        const savedEmployee = res.data?.employee || res.employee;

        // If editing and password was changed, update password as well
        if (isEditing && isChangingPassword && newPassword) {
          const passRes = await employeesApi.updateEmployeePassword(initialData._id, newPassword);
          if (!passRes.ok) {
            dispatch(
              addNotification({
                type: "error",
                message: passRes.message || "Failed to update employee password.",
              })
            );
          } else {
            dispatch(
              addNotification({
                type: "success",
                message: "Employee password updated successfully.",
              })
            );
          }
        }

        dispatch(
          addNotification({
            type: "success",
            message: isEditing
              ? "Employee profile updated successfully."
              : `Employee "${savedEmployee.fullName}" created successfully.`,
          })
        );
        onSuccess?.(savedEmployee);
        onClose();
      } else if (res.code === "USER_EMAIL_EXISTS") {
        const msg = res.message || "A user account with this email already exists. Please use 'Add from Existing Account' instead.";
        setSubmitError(msg);
        dispatch(addNotification({ type: "error", message: msg }));
      } else if (res.code === "EMPLOYEE_EMAIL_EXISTS" || res.status === 409) {
        const msg = res.message || "An employee already exists with this email.";
        setSubmitError(msg);
        if (res.employee) {
          setManualConflictEmployee(res.employee);
        }
        dispatch(addNotification({ type: "error", message: msg }));
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

  const showDetailsForm = isEditing || creationMethod === "manual" || (creationMethod === "existing_user" && selectedUser);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? `Edit Employee — ${initialData?.fullName}` : "Add Employee"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update workforce master details and configuration"
                  : "Choose how you want to add this employee."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METHOD SELECTION CARDS (Create mode only) */}
        {!isEditing && (
          <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/40">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              How would you like to add this employee?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Add from Existing Account */}
              <button
                type="button"
                onClick={() => handleSwitchMethod("existing_user")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  creationMethod === "existing_user"
                    ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creationMethod === "existing_user"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  }`}
                >
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Add from Existing Account</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Search a registered user & link to employee record
                  </p>
                </div>
              </button>

              {/* Option 2: Add Manually */}
              <button
                type="button"
                onClick={() => handleSwitchMethod("manual")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  creationMethod === "manual"
                    ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creationMethod === "manual"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Add Manually</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Create an employee and system login account
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {submitError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-2">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-semibold">{submitError}</span>
            </div>
            {submitError.includes("Add from Existing Account") && (
              <button
                type="button"
                onClick={() => handleSwitchMethod("existing_user", watch("email") || "")}
                className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Switch to Add from Existing Account</span>
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

        {/* METHOD 1 SEARCH STEP: When existing_user is active and no user selected yet */}
        {!isEditing && creationMethod === "existing_user" && !selectedUser && (
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Search System User
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
                      setHasSearchedUser(false);
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
                  disabled={isSearchingUser}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Search className={`w-3.5 h-3.5 ${isSearchingUser ? "animate-spin" : ""}`} />
                  <span>{isSearchingUser ? "Searching..." : "Search"}</span>
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
            {isSearchingUser && (
              <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-2 text-slate-500">
                <Search className="w-5 h-5 animate-spin text-indigo-600" />
                <p className="text-xs font-bold text-slate-700">Searching user directory...</p>
                <p className="text-[11px] text-slate-400">Querying registered accounts in User database</p>
              </div>
            )}

            {/* User Found Card (Available to link) */}
            {!isSearchingUser && hasSearchedUser && foundUser && !isAlreadyEmployee && !hasInconsistency && (
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
                    {foundUser.isActive !== false ? "Active Account" : "Disabled"}
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

            {/* Case C: User Found But Already an Employee */}
            {!isSearchingUser && hasSearchedUser && foundUser && isAlreadyEmployee && !hasInconsistency && (
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
            {!isSearchingUser && hasSearchedUser && hasInconsistency && (
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

            {/* Case A: User Not Found */}
            {!isSearchingUser && hasSearchedUser && !foundUser && (
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
                  onClick={() => handleSwitchMethod("manual", searchEmail.trim().toLowerCase())}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Employee Manually</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* DETAILS FORM & TABS: Rendered when user is selected (Method 1) or in Manual Mode (Method 2) or in Edit Mode */}
        {showDetailsForm && (
          <>
            {/* LINKED USER BANNER (Method 1 only) */}
            {!isEditing && creationMethod === "existing_user" && selectedUser && (
              <div className="px-6 pt-3">
                <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {selectedUser.fullName?.slice(0, 2).toUpperCase() || "US"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                          Linked System Account
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{selectedUser.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetUserSelection}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change User</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-white gap-6 mt-2">
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

            {/* Form Body */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
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
                            disabled={!isEditing && creationMethod === "existing_user" && Boolean(selectedUser)}
                            placeholder="e.g. John Doe"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                              !isEditing && creationMethod === "existing_user" && Boolean(selectedUser)
                                ? "bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed"
                                : errors.fullName
                                ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                                : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                            }`}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-xs text-rose-600">{errors.fullName.message}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Work Email <span className="text-rose-500">*</span>
                          </label>
                          {isEditing && (initialData?.isLinkedToUser || initialData?.linkedUser) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              <LinkIcon className="w-3 h-3 text-indigo-600" />
                              System Linked
                            </span>
                          )}
                        </div>
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
                            disabled={!isEditing && creationMethod === "existing_user" && Boolean(selectedUser)}
                            placeholder="john.doe@company.com"
                            className={`w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                              !isEditing && creationMethod === "existing_user" && Boolean(selectedUser)
                                ? "bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed"
                                : errors.email
                                ? "border-rose-400 focus:ring-rose-400/20 bg-rose-50/30"
                                : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                            }`}
                          />
                        </div>
                        {isEditing && (initialData?.isLinkedToUser || initialData?.linkedUser) && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 inline-block" />
                            Email updates will synchronize with the linked system user account.
                          </p>
                        )}
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
                            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password Fields for Manual Creation */}
                      {!isEditing && creationMethod === "manual" && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showManualPassword ? "text" : "password"}
                                value={manualPassword}
                                onChange={(e) => setManualPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                className="w-full pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                required
                                minLength={8}
                              />
                              <button
                                type="button"
                                onClick={() => setShowManualPassword(!showManualPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showManualPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Confirm Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showManualConfirmPassword ? "text" : "password"}
                                value={manualConfirmPassword}
                                onChange={(e) => setManualConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                className="w-full pl-3.5 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                required
                                minLength={8}
                              />
                              <button
                                type="button"
                                onClick={() => setShowManualConfirmPassword(!showManualConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showManualConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Date of Joining */}
                      <div className={`space-y-1.5 ${!isEditing && creationMethod === "manual" ? "" : "md:col-span-2"}`}>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Date of Joining
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            {...register("dateOfJoining")}
                            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Account Security Section (Edit Mode) */}
                      {isEditing && (
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Security</h4>
                                <p className="text-[11px] text-slate-500">Employee system authentication credentials</p>
                              </div>
                            </div>
                            {!isChangingPassword && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsChangingPassword(true);
                                  setNewPassword("");
                                  setConfirmNewPassword("");
                                  setPasswordError("");
                                }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                {initialData?.isLinkedToUser || initialData?.linkedUser ? "Change Password" : "Set New Password"}
                              </button>
                            )}
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Employee Login Email:</span>
                              <span className="font-mono font-semibold text-slate-900">{initialData?.email}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Password:</span>
                              <span className="font-mono text-slate-700 tracking-widest font-bold">••••••••</span>
                            </div>

                            {isChangingPassword && (
                              <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                                {passwordError && (
                                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                    <span>{passwordError}</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">
                                      New Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                      <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => {
                                          setNewPassword(e.target.value);
                                          setPasswordError("");
                                        }}
                                        placeholder="Min. 8 characters"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs pr-9 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                      >
                                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">
                                      Confirm New Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                      <input
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        value={confirmNewPassword}
                                        onChange={(e) => {
                                          setConfirmNewPassword(e.target.value);
                                          setPasswordError("");
                                        }}
                                        placeholder="Re-enter new password"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs pr-9 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                      >
                                        {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsChangingPassword(false);
                                      setNewPassword("");
                                      setConfirmNewPassword("");
                                      setPasswordError("");
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Cancel Password Change
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isEditing ? "Saving..." : "Creating Employee..."}</span>
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
          </>
        )}
      </div>
    </div>
  );
}
