import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  CalendarDays,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  User,
  X,
  FileText,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import LeaveBalanceCard from "../components/LeaveBalanceCard";
import TimeOffRequestListTable from "../components/TimeOffRequestListTable";
import TimeOffRequestFormModal from "../components/TimeOffRequestFormModal";
import timeOffApi from "../../../api/timeOff";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLES, ROLE_GROUPS } from "../../../lib/constants";

export default function TimeOffRequestsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeFilterId = searchParams.get("employee") || "";

  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
    ? [currentUser.role]
    : [];
  const isEmployeeOnly = userRoles.length > 0 && userRoles.every((role) => role === ROLES.EMPLOYEE);
  // Approvals & Refusals can be performed by Admin, HR Manager, HR Payroll Manager, HR Payroll User
  const canAction = userRoles.some((role) => ROLE_GROUPS.HR_MANAGEMENT.includes(role));
  const canWrite = userRoles.some((role) => ROLE_GROUPS.HR_MANAGEMENT.includes(role));

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes, empRes, typesRes] = await Promise.all([
        timeOffApi.listRequests({
          employee: employeeFilterId,
          status: selectedStatus,
          timeOffType: selectedType,
        }),
        !isEmployeeOnly
          ? employeesApi.listEmployees()
          : Promise.resolve({ ok: true, data: { employees: [] } }),
        timeOffApi.listTypes({ status: "Active" }),
      ]);

      if (reqRes.ok && (reqRes.data?.requests || reqRes.requests)) {
        setRequests(reqRes.data?.requests || reqRes.requests || []);
      }
      if (empRes.ok && (empRes.data?.employees || empRes.employees)) {
        setEmployees(empRes.data?.employees || empRes.employees || []);
      }
      if (typesRes.ok) {
        setTypes(typesRes.data?.timeOffTypes || []);
      }
    } catch (err) {
      console.error("Failed to load time off requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeFilterId, selectedStatus, selectedType, isEmployeeOnly]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshCounter]);

  // Handle Approve
  const handleApprove = async (req) => {
    try {
      const res = await timeOffApi.approveRequest(req._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Leave request approved successfully.",
          })
        );
        setRefreshCounter((c) => c + 1);
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to approve leave request",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // Handle Refuse
  const handleRefuse = async (req, reason) => {
    try {
      const res = await timeOffApi.refuseRequest(req._id, reason);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Leave request refused.",
          })
        );
        setRefreshCounter((c) => c + 1);
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to refuse leave request",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // Handle Delete
  const handleDelete = async (req) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel and delete this leave request?`
      )
    ) {
      return;
    }

    try {
      const res = await timeOffApi.deleteRequest(req._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Leave request removed.",
          })
        );
        setRefreshCounter((c) => c + 1);
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete leave request",
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

  // Metrics KPI
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "Submitted").length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const refused = requests.filter((r) => r.status === "Refused").length;

    return { total, pending, approved, refused };
  }, [requests]);

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  return (
    <PageContainer
      title={isEmployeeOnly ? "My Time Off Requests" : "Time Off Management"}
      description={
        isEmployeeOnly
          ? "Submit leave applications, track balance deductions, and monitor approval status"
          : "Review workforce time off submissions, approve leaves, and oversee employee balances"
      }
      breadcrumbs={[{ label: "Time Off", path: "/time-off/requests" }, { label: "Requests" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRefreshCounter((c) => c + 1)}
            title="Refresh requests"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Time Off</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Personal or Scoped Leave Balances Card */}
        {(isEmployeeOnly || employeeFilterId) && (
          <LeaveBalanceCard
            employeeId={
              employeeFilterId ||
              currentUser?.employee?._id ||
              currentUser?.employeeId ||
              (typeof currentUser?.employee === "string" ? currentUser.employee : "")
            }
            onRequestLeave={() => setIsModalOpen(true)}
            refreshTrigger={refreshCounter}
          />
        )}

        {/* Filter Alert Banner when deep-linked */}
        {!isEmployeeOnly && filteredEmployee && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-900 font-semibold">
              <User className="w-4 h-4 text-indigo-600" />
              <span>
                Filtering time off requests for:{" "}
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

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Requests
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Approval
              </p>
              <p className="text-2xl font-black text-amber-600 tracking-tight">{metrics.pending}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {metrics.approved}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Refused
              </p>
              <p className="text-2xl font-black text-rose-600 tracking-tight">{metrics.refused}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted (Pending)</option>
              <option value="Approved">Approved</option>
              <option value="Refused">Refused</option>
            </select>

            {/* Leave Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Leave Types</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>

            {(selectedStatus || selectedType || employeeFilterId) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("");
                  setSelectedType("");
                  if (employeeFilterId) clearEmployeeFilter();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <TimeOffRequestListTable
          requests={requests}
          isLoading={isLoading}
          showEmployeeColumn={!isEmployeeOnly}
          onApprove={handleApprove}
          onRefuse={handleRefuse}
          onDelete={handleDelete}
          canAction={canAction}
          canWrite={canWrite}
        />
      </div>

      {/* Submission Modal */}
      <TimeOffRequestFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedEmployeeId={employeeFilterId}
        isEmployeeView={isEmployeeOnly}
        onSuccess={() => {
          setRefreshCounter((c) => c + 1);
        }}
        employees={employees}
        timeOffTypes={types}
      />
    </PageContainer>
  );
}
