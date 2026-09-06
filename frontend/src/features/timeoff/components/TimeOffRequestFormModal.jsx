import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Info,
  Lock,
  ArrowRight,
} from "lucide-react";
import timeOffApi from "../../../api/timeOff";
import { addNotification } from "../../notifications/notificationSlice";

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return "Open";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Open";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
};

export default function TimeOffRequestFormModal({
  isOpen = false,
  onClose,
  initialData = null,
  preselectedEmployeeId = "",
  isEmployeeView = false,
  onSuccess,
  employees = [],
  timeOffTypes = [],
}) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const currentEmployeeId =
    currentUser?.employee?._id ||
    currentUser?.employeeId ||
    (typeof currentUser?.employee === "string" ? currentUser.employee : "");

  const isEditing = Boolean(initialData?._id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [employeeAllocations, setEmployeeAllocations] = useState([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      employee: "",
      timeOffType: "",
      startDate: "",
      endDate: "",
      duration: "1",
      reason: "",
    },
  });

  const startDateVal = watch("startDate");
  const endDateVal = watch("endDate");
  const durationVal = watch("duration");
  const selectedTypeId = watch("timeOffType");
  const selectedEmployeeId = watch("employee");

  const effectiveEmployeeId =
    selectedEmployeeId || preselectedEmployeeId || (isEmployeeView ? currentEmployeeId : "");
  const selectedTypeObj = timeOffTypes.find((t) => String(t._id) === String(selectedTypeId));
  const selectedEmployeeObj = employees.find((e) => String(e._id) === String(effectiveEmployeeId));

  // STEP 1 & 2: Fetch approved allocations for live validity date range & quota feedback
  useEffect(() => {
    async function loadAllocations() {
      if (!isOpen || !effectiveEmployeeId) {
        setEmployeeAllocations([]);
        setIsLoadingAllocations(false);
        return;
      }
      setIsLoadingAllocations(true);
      try {
        const res = await timeOffApi.listAllocations({
          employee: effectiveEmployeeId,
          status: "Approved",
        });
        const rawAllocations = res.ok ? res.data?.allocations || res.allocations || [] : [];

        // STEP 3: Deduplicate allocations by unique database ID (_id / id)
        const uniqueAllocations = Array.from(
          new Map(rawAllocations.map((a) => [String(a._id || a.id), a])).values()
        );

        setEmployeeAllocations(uniqueAllocations);
      } catch (err) {
        console.error("Failed to load allocations for validation:", err);
        setEmployeeAllocations([]);
      } finally {
        setIsLoadingAllocations(false);
      }
    }
    loadAllocations();
  }, [isOpen, effectiveEmployeeId]);

  // STEP 2 & 9: Dynamic Duration Recalculation based on working schedule
  const recomputeDuration = useCallback(async () => {
    if (!startDateVal || !endDateVal) {
      setValue("duration", "0");
      return;
    }

    const s = new Date(startDateVal);
    const e = new Date(endDateVal);

    if (s > e) {
      setValue("duration", "0");
      return;
    }

    // 1. Immediate client estimation using employee working schedule or Monday-Friday
    let workingDaysSet = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]);
    if (
      selectedEmployeeObj &&
      selectedEmployeeObj.workingSchedule &&
      Array.isArray(selectedEmployeeObj.workingSchedule.days) &&
      selectedEmployeeObj.workingSchedule.days.length > 0
    ) {
      workingDaysSet = new Set(
        selectedEmployeeObj.workingSchedule.days
          .filter((d) => d.day)
          .map((d) => d.day.toLowerCase())
      );
    }

    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let clientCount = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const dayName = days[cur.getUTCDay()];
      if (workingDaysSet.has(dayName)) {
        clientCount++;
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    setValue("duration", String(clientCount));

    // 2. Authoritative server-side calculation query
    if (effectiveEmployeeId) {
      setIsCalculatingDuration(true);
      try {
        const res = await timeOffApi.calculateDuration({
          employee: effectiveEmployeeId,
          startDate: startDateVal,
          endDate: endDateVal,
          unit: selectedTypeObj?.unit || "Days",
        });

        if (res.ok && res.data?.duration !== undefined) {
          setValue("duration", String(res.data.duration));
        } else if (res.ok && res.duration !== undefined) {
          setValue("duration", String(res.duration));
        }
      } catch (err) {
        console.error("Server duration calculation failed, using schedule estimate:", err);
      } finally {
        setIsCalculatingDuration(false);
      }
    }
  }, [startDateVal, endDateVal, effectiveEmployeeId, selectedTypeObj?.unit, selectedEmployeeObj, setValue]);

  useEffect(() => {
    recomputeDuration();
  }, [recomputeDuration]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (initialData) {
        reset({
          employee: initialData.employee?._id || initialData.employee || "",
          timeOffType: initialData.timeOffType?._id || initialData.timeOffType || "",
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().slice(0, 10)
            : "",
          endDate: initialData.endDate
            ? new Date(initialData.endDate).toISOString().slice(0, 10)
            : "",
          duration: initialData.duration != null ? String(initialData.duration) : "1",
          reason: initialData.reason || "",
        });
      } else {
        const todayStr = new Date().toISOString().slice(0, 10);
        reset({
          employee: preselectedEmployeeId || "",
          timeOffType: timeOffTypes[0]?._id || "",
          startDate: todayStr,
          endDate: todayStr,
          duration: "1",
          reason: "",
        });
      }
    }
  }, [isOpen, initialData, preselectedEmployeeId, reset, timeOffTypes]);

  // STEP 3, 4, 6, 7 & 8: Live Allocation Validity, Quota & Remaining Balance Verification
  const allocationFeedback = React.useMemo(() => {
    // Check Date Order first
    if (startDateVal && endDateVal) {
      const sDate = new Date(startDateVal);
      const eDate = new Date(endDateVal);
      if (sDate > eDate) {
        return {
          isApplicable: true,
          isValid: false,
          severity: "error",
          title: "Invalid Date Range",
          message: "End date cannot be earlier than the start date.",
          availableDays: 0,
          requestedDays: 0,
          remainingAfterRequest: 0,
          validityRanges: [],
        };
      }
    }

    if (!selectedTypeObj || selectedTypeObj.requiresAllocation === false) {
      return { isApplicable: false, isValid: true, message: null };
    }

    if (!effectiveEmployeeId) {
      return {
        isApplicable: true,
        isValid: false,
        severity: "info",
        title: "Select Employee",
        message: "Please select an employee to view available quota and validity.",
        availableDays: 0,
        requestedDays: 0,
        remainingAfterRequest: 0,
        validityRanges: [],
      };
    }

    // Step 3 & 4: Deduplicate allocations and filter by employee & leave type
    const uniqueAllocations = Array.from(
      new Map(employeeAllocations.map((a) => [String(a._id || a.id), a])).values()
    );

    const typeAllocations = uniqueAllocations.filter((a) => {
      const aEmpId = String(a.employee?._id || a.employee || "");
      const aTypeId = String(a.timeOffType?._id || a.timeOffType || "");
      const targetEmpId = String(effectiveEmployeeId);
      const targetTypeId = String(selectedTypeId);
      return (
        a.status === "Approved" &&
        aEmpId === targetEmpId &&
        aTypeId === targetTypeId
      );
    });

    if (typeAllocations.length === 0) {
      return {
        isApplicable: true,
        isValid: false,
        severity: "error",
        title: "No Quota Allocated",
        message: `No approved allocation found for "${selectedTypeObj.name}". You must have an approved leave allocation before applying.`,
        availableDays: 0,
        requestedDays: 0,
        remainingAfterRequest: 0,
        validityRanges: [],
      };
    }

    // Step 5: Deduplicate validity periods using valid_from + valid_until
    const periodMap = new Map();
    for (const alloc of typeAllocations) {
      const fromStr = alloc.validFrom
        ? new Date(alloc.validFrom).toISOString().slice(0, 10)
        : "Open";
      const toStr = alloc.validTo ? new Date(alloc.validTo).toISOString().slice(0, 10) : "Open";
      const key = `${fromStr}::${toStr}`;

      const rem =
        typeof alloc.remainingAmount === "number"
          ? alloc.remainingAmount
          : Math.max(0, (Number(alloc.allocatedAmount) || 0) - (Number(alloc.takenAmount) || 0));

      if (!periodMap.has(key)) {
        periodMap.set(key, {
          key,
          validFrom: alloc.validFrom,
          validTo: alloc.validTo,
          fromStr,
          toStr,
          formattedRange: `${formatDateDisplay(alloc.validFrom)} → ${formatDateDisplay(
            alloc.validTo
          )}`,
          remainingDays: rem,
        });
      } else {
        const existing = periodMap.get(key);
        existing.remainingDays += rem;
      }
    }
    const uniquePeriods = Array.from(periodMap.values());

    if (!startDateVal || !endDateVal) {
      const totalAvail = uniquePeriods.reduce((sum, p) => sum + p.remainingDays, 0);
      return {
        isApplicable: true,
        isValid: true,
        severity: "info",
        title: "Select Leave Dates",
        availableDays: totalAvail,
        requestedDays: 0,
        remainingAfterRequest: totalAvail,
        validityRanges: uniquePeriods,
      };
    }

    const sDate = new Date(startDateVal);
    const eDate = new Date(endDateVal);

    // Step 6 & 7: Filter allocations that cover the requested date range
    const coveringAllocations = typeAllocations.filter((alloc) => {
      const aFrom = alloc.validFrom ? new Date(alloc.validFrom) : null;
      const aTo = alloc.validTo ? new Date(alloc.validTo) : null;
      if (aFrom && sDate < aFrom) return false;
      if (aTo && eDate > aTo) return false;
      return true;
    });

    if (coveringAllocations.length === 0) {
      const hasFuture = typeAllocations.some((a) => a.validFrom && sDate < new Date(a.validFrom));
      const hasPast = typeAllocations.some((a) => a.validTo && eDate > new Date(a.validTo));

      let msg = "Selected leave dates are outside your allocated quota validity period.";
      if (hasFuture && !hasPast) {
        msg = `Selected start date (${startDateVal}) is before your "${selectedTypeObj.name}" allocation validity period starts.`;
      } else if (hasPast && !hasFuture) {
        msg = `Selected end date (${endDateVal}) exceeds your "${selectedTypeObj.name}" allocation validity period.`;
      }

      return {
        isApplicable: true,
        isValid: false,
        severity: "error",
        title: "Allocation Period Conflict",
        message: msg,
        availableDays: 0,
        requestedDays: Number(durationVal) || 0,
        remainingAfterRequest: 0,
        validityRanges: uniquePeriods,
      };
    }

    // Deduplicate covering periods
    const coveringPeriodMap = new Map();
    for (const alloc of coveringAllocations) {
      const fromStr = alloc.validFrom
        ? new Date(alloc.validFrom).toISOString().slice(0, 10)
        : "Open";
      const toStr = alloc.validTo ? new Date(alloc.validTo).toISOString().slice(0, 10) : "Open";
      const key = `${fromStr}::${toStr}`;

      const rem =
        typeof alloc.remainingAmount === "number"
          ? alloc.remainingAmount
          : Math.max(0, (Number(alloc.allocatedAmount) || 0) - (Number(alloc.takenAmount) || 0));

      if (!coveringPeriodMap.has(key)) {
        coveringPeriodMap.set(key, {
          key,
          validFrom: alloc.validFrom,
          validTo: alloc.validTo,
          fromStr,
          toStr,
          formattedRange: `${formatDateDisplay(alloc.validFrom)} → ${formatDateDisplay(
            alloc.validTo
          )}`,
          remainingDays: rem,
        });
      } else {
        const existing = coveringPeriodMap.get(key);
        existing.remainingDays += rem;
      }
    }
    const coveringUniquePeriods = Array.from(coveringPeriodMap.values());
    const totalCoveringRemaining = coveringUniquePeriods.reduce(
      (sum, p) => sum + p.remainingDays,
      0
    );

    const requestedDuration = Number(durationVal) || 0;

    if (requestedDuration <= 0) {
      return {
        isApplicable: true,
        isValid: false,
        severity: "error",
        title: "No Working Days Selected",
        message: "The selected date range contains 0 working days according to your assigned working schedule.",
        availableDays: totalCoveringRemaining,
        requestedDays: 0,
        remainingAfterRequest: totalCoveringRemaining,
        validityRanges: coveringUniquePeriods,
      };
    }

    if (requestedDuration > totalCoveringRemaining) {
      return {
        isApplicable: true,
        isValid: false,
        severity: "error",
        title: "Insufficient Leave Balance",
        message: `Insufficient leave balance. You have ${totalCoveringRemaining.toFixed(
          1
        )} ${selectedTypeObj.unit || "days"} available, but this request requires ${requestedDuration} ${
          selectedTypeObj.unit || "days"
        }.`,
        availableDays: totalCoveringRemaining,
        requestedDays: requestedDuration,
        remainingAfterRequest: totalCoveringRemaining - requestedDuration,
        validityRanges: coveringUniquePeriods,
      };
    }

    return {
      isApplicable: true,
      isValid: true,
      severity: "success",
      title: "Quota Available",
      availableDays: totalCoveringRemaining,
      requestedDays: requestedDuration,
      remainingAfterRequest: totalCoveringRemaining - requestedDuration,
      validityRanges: coveringUniquePeriods,
    };
  }, [
    selectedTypeObj,
    employeeAllocations,
    effectiveEmployeeId,
    selectedTypeId,
    startDateVal,
    endDateVal,
    durationVal,
  ]);

  if (!isOpen) return null;

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage("");

    if (allocationFeedback.isApplicable && !allocationFeedback.isValid) {
      setErrorMessage(allocationFeedback.message);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        timeOffType: formData.timeOffType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: Number(formData.duration),
        reason: formData.reason?.trim() || "",
      };

      if (!isEmployeeView && formData.employee) {
        payload.employee = formData.employee;
      }

      const res = await timeOffApi.createRequest(payload);

      if (res.ok && (res.success || res.data?.request || res.request)) {
        const saved = res.data?.request || res.request;
        dispatch(
          addNotification({
            type: "success",
            message: `Time off request for ${saved.duration} ${
              saved.duration === 1 ? "day" : "days"
            } submitted successfully.`,
          })
        );
        if (onSuccess) onSuccess(saved);
        onClose();
      } else {
        const msg = res.message || res.error || "Failed to submit time off request";
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? "Edit Time Off Request" : "Apply for Time Off"}
              </h2>
              <p className="text-xs text-slate-500">
                Submit your leave request and select the requested period
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
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Submission Conflict</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {/* SECTION 1: Request Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Request Details</span>
              </div>

              {/* Employee Selector (if HR view) */}
              {!isEmployeeView && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("employee", { required: "Employee is required" })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                  {errors.employee && (
                    <p className="text-xs text-rose-600 font-medium">{errors.employee.message}</p>
                  )}
                </div>
              )}

              {/* Time Off Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Time Off Type <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("timeOffType", { required: "Time off type is required" })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                >
                  <option value="">— Select Leave Type —</option>
                  {timeOffTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.isPaid ? "Paid" : "Unpaid"} • {t.unit || "Days"})
                    </option>
                  ))}
                </select>
                {errors.timeOffType && (
                  <p className="text-xs text-rose-600 font-medium">{errors.timeOffType.message}</p>
                )}
              </div>
            </div>

            {/* SECTION 2: Leave Period */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Leave Period</span>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("startDate", { required: "Start date is required" })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  {errors.startDate && (
                    <p className="text-xs text-rose-600 font-medium">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("endDate", { required: "End date is required" })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  {errors.endDate && (
                    <p className="text-xs text-rose-600 font-medium">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Duration Field (Read-Only & Auto-Calculated) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Duration ({selectedTypeObj?.unit || "Days"})</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Lock className="w-2.5 h-2.5" />
                    Auto-Calculated
                  </span>
                </div>
                
                <div className="relative">
                  <div className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-sm font-bold text-slate-900 flex items-center justify-between shadow-2xs">
                    <span className="text-sm font-bold font-mono text-indigo-950">
                      {isCalculatingDuration ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-normal">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          Calculating working days...
                        </span>
                      ) : (
                        `${durationVal || "0"} ${selectedTypeObj?.unit || "Days"}`
                      )}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-2xs">
                      Read-Only
                    </span>
                  </div>
                  {/* Hidden input for react-hook-form registration */}
                  <input type="hidden" {...register("duration")} />
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Calculated automatically based on the selected dates and working schedule.
                </p>
              </div>

              {/* Quota & Allocation Validity Feedback Section */}
              {allocationFeedback.isApplicable && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    allocationFeedback.isValid
                      ? "bg-slate-50/90 border-slate-200/80"
                      : "bg-rose-50/80 border-rose-200 text-rose-900"
                  }`}
                >
                  {allocationFeedback.isValid ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Quota Available:
                        </span>
                        <span className="text-xs font-black text-indigo-600 font-mono">
                          {allocationFeedback.availableDays?.toFixed(1)} {selectedTypeObj?.unit || "Days"}
                        </span>
                      </div>

                      {allocationFeedback.validityRanges && allocationFeedback.validityRanges.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Valid For:
                          </span>
                          {allocationFeedback.validityRanges.length === 1 ? (
                            <span className="font-semibold text-slate-800 text-xs block">
                              {allocationFeedback.validityRanges[0].formattedRange}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {allocationFeedback.validityRanges.map((p) => (
                                <div
                                  key={p.key}
                                  className="flex items-center justify-between text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200/60"
                                >
                                  <span className="text-slate-600 font-medium text-[11px]">
                                    {p.formattedRange}
                                  </span>
                                  <span className="font-bold text-indigo-600">
                                    {p.remainingDays.toFixed(1)} {selectedTypeObj?.unit || "Days"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Requested:
                          </span>
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {allocationFeedback.requestedDays} {selectedTypeObj?.unit || "Days"}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Remaining After:
                          </span>
                          <span className="font-bold text-emerald-600 font-mono text-xs">
                            {allocationFeedback.remainingAfterRequest?.toFixed(1)} {selectedTypeObj?.unit || "Days"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-rose-700 font-bold text-xs sm:text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>⚠ {allocationFeedback.title || "Insufficient Leave Balance"}</span>
                      </div>
                      <p className="text-xs text-rose-700 leading-relaxed font-medium">
                        {allocationFeedback.message}
                      </p>
                      {allocationFeedback.title === "Insufficient Leave Balance" && (
                        <div className="p-2.5 bg-white/80 rounded-lg border border-rose-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Available:
                            </span>
                            <span className="font-bold text-slate-800 font-mono">
                              {allocationFeedback.availableDays?.toFixed(1)} {selectedTypeObj?.unit || "Days"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                              Requested:
                            </span>
                            <span className="font-bold text-rose-700 font-mono">
                              {allocationFeedback.requestedDays} {selectedTypeObj?.unit || "Days"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: Additional Notes */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Additional Information</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason / Description
                </label>
                <textarea
                  rows={2}
                  {...register("reason")}
                  placeholder="Add any relevant details about your time off request..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (allocationFeedback.isApplicable && !allocationFeedback.isValid) || Number(durationVal) <= 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Changes" : "Submit Time Off Request"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
