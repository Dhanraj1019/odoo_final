import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Award,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  User,
  X,
  Layers,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import TimeOffAllocationListTable from "../components/TimeOffAllocationListTable";
import TimeOffAllocationFormModal from "../components/TimeOffAllocationFormModal";
import timeOffApi from "../../../api/timeOff";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function TimeOffAllocationsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeFilterId = searchParams.get("employee") || "";

  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
    ? [currentUser.role]
    : [];
  const canWrite = userRoles.some((role) => ROLE_GROUPS.HR_MANAGEMENT.includes(role));
  const canApprove = userRoles.some((role) => ROLE_GROUPS.HR_MANAGEMENT.includes(role));

  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allocRes, empRes, typesRes] = await Promise.all([
        timeOffApi.listAllocations({
          employee: employeeFilterId,
          status: selectedStatus,
          timeOffType: selectedType,
        }),
        employeesApi.listEmployees(),
        timeOffApi.listTypes({ status: "Active" }),
      ]);

      if (allocRes.ok && (allocRes.data?.allocations || allocRes.allocations)) {
        setAllocations(allocRes.data?.allocations || allocRes.allocations || []);
      }
      if (empRes.ok && (empRes.data?.employees || empRes.employees)) {
        setEmployees(empRes.data?.employees || empRes.employees || []);
      }
      if (typesRes.ok) {
        setTypes(typesRes.data?.timeOffTypes || []);
      }
    } catch (err) {
      console.error("Failed to load time off allocations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeFilterId, selectedStatus, selectedType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Approve Allocation
  const handleApprove = async (alloc) => {
    try {
      const res = await timeOffApi.approveAllocation(alloc._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Leave allocation approved successfully.",
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to approve allocation",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // Handle Delete Allocation
  const handleDelete = async (alloc) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this allocation for ${
          alloc.employee?.fullName || "this employee"
        }?`
      )
    ) {
      return;
    }

    try {
      const res = await timeOffApi.deleteAllocation(alloc._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Leave allocation removed.",
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete allocation",
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

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  return (
    <PageContainer
      title="Time Off Allocations"
      description="Grant and manage annual leave quotas, balances, and accruals for employees"
      breadcrumbs={[{ label: "Time Off", path: "/time-off/requests" }, { label: "Allocations" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh allocations"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingAllocation(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Allocation</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Alert Banner when deep-linked */}
        {filteredEmployee && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-900 font-semibold">
              <User className="w-4 h-4 text-indigo-600" />
              <span>
                Filtering allocations for employee:{" "}
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
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Expired">Expired</option>
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

        {/* Allocations Data Table */}
        <TimeOffAllocationListTable
          allocations={allocations}
          isLoading={isLoading}
          onApprove={handleApprove}
          onEdit={(alloc) => {
            setEditingAllocation(alloc);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          canWrite={canWrite}
          canApprove={canApprove}
        />
      </div>

      {/* Allocation Creation & Edit Modal */}
      <TimeOffAllocationFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAllocation(null);
        }}
        initialData={editingAllocation}
        preselectedEmployeeId={employeeFilterId}
        onSuccess={() => {
          loadData();
        }}
        employees={employees}
        timeOffTypes={types}
      />
    </PageContainer>
  );
}
