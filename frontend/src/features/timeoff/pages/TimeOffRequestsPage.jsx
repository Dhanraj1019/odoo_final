import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  ArrowLeft,
  Search,
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Client-side search filtering across loaded requests
  const displayedRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((item) => {
      const empName = item.employee?.fullName?.toLowerCase() || "";
      const empCode = item.employee?.employeeCode?.toLowerCase() || "";
      const typeName = item.timeOffType?.name?.toLowerCase() || "";
      const reason = item.reason?.toLowerCase() || "";
      const status = item.status?.toLowerCase() || "";
      return (
        empName.includes(q) ||
        empCode.includes(q) ||
        typeName.includes(q) ||
        reason.includes(q) ||
        status.includes(q)
      );
    });
  }, [requests, searchQuery]);

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  return (
    <PageContainer
      title={isEmployeeOnly ? "My Time Off Requests" : "Time Off Requests"}
      description={
        isEmployeeOnly
          ? "Submit leave applications, track balance deductions, and monitor approval status"
          : "Manage employee leave requests and approval workflows."
      }
      breadcrumbs={[{ label: "Time Off", path: "/time-off/requests" }, { label: "Requests" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRefreshCounter((c) => c + 1)}
            title="Refresh requests"
            className="p-2 bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
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

        {/* Filter Context Banner when deep-linked */}
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
                  Showing Time Off Requests for:{" "}
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
                Show All Requests
              </button>
            </div>
          </div>
        )}

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Requests
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pending Approval
              </p>
              <p className="text-2xl font-black text-amber-600 tracking-tight">{metrics.pending}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Refused
              </p>
              <p className="text-2xl font-black text-rose-600 tracking-tight">{metrics.refused}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

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
                placeholder="Search requests or employee..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Leave Types</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedStatus || selectedType || employeeFilterId) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("");
                setSelectedType("");
                if (employeeFilterId) clearEmployeeFilter();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Data Table */}
        <TimeOffRequestListTable
          requests={displayedRequests}
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
        preselectedEmployeeId={
          employeeFilterId ||
          (isEmployeeOnly
            ? currentUser?.employee?._id ||
              currentUser?.employeeId ||
              (typeof currentUser?.employee === "string" ? currentUser.employee : "")
            : "")
        }
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
