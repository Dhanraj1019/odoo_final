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

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  return (
    <PageContainer
      title={isEmployeeOnly ? "My Attendance Console" : "Workforce Attendance Logs"}
      description={
        isEmployeeOnly
          ? "Punch in/out for your shift and review personal work duration history"
          : "Track daily check-ins, check-outs, worked hours, and automated overtime calculations"
      }
      breadcrumbs={[{ label: "Attendance" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh attendance records"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
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

        {/* Filter Alert Banner when navigating from employee profile */}
        {!isEmployeeOnly && filteredEmployee && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-900 font-semibold">
              <User className="w-4 h-4 text-indigo-600" />
              <span>
                Filtering attendance logs for employee:{" "}
                <span className="font-bold underline">{filteredEmployee.fullName}</span> (
                {filteredEmployee.employeeCode})
              </span>
            </div>
            <button
              type="button"
              onClick={clearEmployeeFilter}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-indigo-700 hover:bg-indigo-100 font-bold text-xs shadow-2xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Show All Employees
            </button>
          </div>
        )}

        {/* For HR: KPI Metric Cards */}
        {!isEmployeeOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Logs
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Late Arrivals
                </p>
                <p className="text-2xl font-black text-amber-600 tracking-tight">{metrics.late}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Average Worked
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {metrics.avgHours} <span className="text-xs font-normal text-slate-500">hrs</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls (for HR and Employee date range) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Date Range: From */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Date Range: To */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Absent">Absent</option>
            </select>

            {(fromDate || toDate || selectedStatus || employeeFilterId) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setSelectedStatus("");
                  if (employeeFilterId) clearEmployeeFilter();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table of Records */}
        <AttendanceListTable
          attendances={attendances}
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
