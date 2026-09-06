import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  CalendarCheck,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  X,
  Calendar,
  ArrowLeft,
  Search,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import AttendanceWidget from "../components/AttendanceWidget";
import AttendanceListTable from "../components/AttendanceListTable";
import AttendanceFormModal from "../components/AttendanceFormModal";
import attendanceApi from "../../../api/attendance";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLES, ROLE_GROUPS } from "../../../lib/constants";

export default function AttendancePage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeFilterId = searchParams.get("employee") || "";

  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
    ? [currentUser.role]
    : [];
  const isEmployeeOnly = userRoles.length === 1 && userRoles[0] === ROLES.EMPLOYEE;
  const canWrite = userRoles.some((role) =>
    ROLE_GROUPS.HR_MANAGEMENT.includes(role)
  );

  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceApi.listAttendances({
          employee: employeeFilterId,
          from: fromDate,
          to: toDate,
          status: selectedStatus,
        }),
        !isEmployeeOnly ? employeesApi.listEmployees() : Promise.resolve({ ok: true, data: { employees: [] } }),
      ]);

      if (attRes.ok && (attRes.data?.attendances || attRes.attendances)) {
        setAttendances(attRes.data?.attendances || attRes.attendances || []);
      }
      if (empRes.ok && (empRes.data?.employees || empRes.employees)) {
        setEmployees(empRes.data?.employees || empRes.employees || []);
      }
    } catch (err) {
      console.error("Failed to load attendance logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeFilterId, fromDate, toDate, selectedStatus, isEmployeeOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (record) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the attendance log for ${
          record.employee?.fullName || "this record"
        } on ${new Date(record.date).toLocaleDateString()}?`
      )
    ) {
      return;
    }

    try {
      const res = await attendanceApi.deleteAttendance(record._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Attendance log removed successfully.",
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete attendance record",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // Matched employee object for filter banner
  const filteredEmployee = useMemo(() => {
    if (!employeeFilterId) return null;
    return employees.find((e) => e._id === employeeFilterId);
  }, [employeeFilterId, employees]);

  // HR Workforce KPI Summary
  const metrics = useMemo(() => {
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "Present").length;
    const late = attendances.filter((a) => a.status === "Late").length;
    const totalHours = attendances.reduce((sum, a) => sum + (a.workedHours || 0), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : "0.0";

    return { total, present, late, avgHours };
  }, [attendances]);

  // Filtered attendances based on client-side search query
  const displayedAttendances = useMemo(() => {
    if (!searchQuery.trim()) return attendances;
    const q = searchQuery.toLowerCase().trim();
    return attendances.filter((item) => {
      const empName = item.employee?.fullName?.toLowerCase() || "";
      const empCode = item.employee?.employeeCode?.toLowerCase() || "";
      const notes = item.notes?.toLowerCase() || "";
      const status = item.status?.toLowerCase() || "";
      return empName.includes(q) || empCode.includes(q) || notes.includes(q) || status.includes(q);
    });
  }, [attendances, searchQuery]);

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  return (
    <PageContainer
      title={isEmployeeOnly ? "My Attendance Console" : "Attendance Tracker"}
      description={
        isEmployeeOnly
          ? "Punch in/out for your shift and review personal work duration history"
          : "Track employee check-ins, check-outs, worked hours, and attendance activity"
      }
      breadcrumbs={[{ label: "Attendance" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh attendance records"
            className="p-2 bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingAttendance(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* For Employee role: render check-in console at top */}
        {isEmployeeOnly && (
          <AttendanceWidget onAttendanceUpdated={loadData} />
        )}

        {/* Filter Context Banner when navigating from employee profile */}
        {!isEmployeeOnly && filteredEmployee && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-3 text-indigo-950 font-medium">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider block">
                  Scoped View
                </span>
                <span className="font-bold text-slate-900">
                  Showing attendance for:{" "}
                  <span className="text-indigo-700 font-black underline">
                    {filteredEmployee.fullName} • {filteredEmployee.employeeCode}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/employees/${filteredEmployee._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-2xs transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Profile
              </Link>
              <button
                type="button"
                onClick={clearEmployeeFilter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Show All Attendance
              </button>
            </div>
          </div>
        )}

        {/* For HR: KPI Metric Cards */}
        {!isEmployeeOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Logs
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Present On-Time
                </p>
                <p className="text-2xl font-black text-emerald-600 tracking-tight">
                  {metrics.present}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Late Arrivals
                </p>
                <p className="text-2xl font-black text-amber-600 tracking-tight">{metrics.late}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Average Worked
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {metrics.avgHours} <span className="text-xs font-semibold text-slate-400">hrs</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Realtime Search Box */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs or employee..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Date Range: From */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-400">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Date Range: To */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-400">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {(searchQuery || fromDate || toDate || selectedStatus || employeeFilterId) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
                setSelectedStatus("");
                if (employeeFilterId) clearEmployeeFilter();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Table of Records */}
        <AttendanceListTable
          attendances={displayedAttendances}
          isLoading={isLoading}
          showEmployeeColumn={!isEmployeeOnly}
          canWrite={canWrite}
          onEdit={(record) => {
            setEditingAttendance(record);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      {/* Manual Entry & Correction Modal */}
      <AttendanceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAttendance(null);
        }}
        initialData={editingAttendance}
        preselectedEmployeeId={employeeFilterId}
        onSuccess={() => {
          loadData();
        }}
        employees={employees}
      />
    </PageContainer>
  );
}
