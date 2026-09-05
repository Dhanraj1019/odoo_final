import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FileText,
  Plus,
  Filter,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  User,
  X,
  Building2,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import ContractListTable from "../components/ContractListTable";
import ContractFormModal from "../components/ContractFormModal";
import contractsApi from "../../../api/contracts";
import employeesApi from "../../../api/employees";
import referencesApi from "../../../api/references";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function ContractsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeFilterId = searchParams.get("employee") || "";

  const currentUser = useSelector((state) => state.auth.user);
  const userRole = currentUser?.role;
  const canWrite = ROLE_GROUPS.HR_WRITE_ROLES.includes(userRole);

  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [workingSchedules, setWorkingSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [contractsRes, empRes, deptRes, posRes, strRes, schRes] = await Promise.all([
        contractsApi.listContracts({
          employee: employeeFilterId,
          department: selectedDepartment,
          status: selectedStatus,
        }),
        employeesApi.listEmployees(),
        referencesApi.listDepartments(),
        referencesApi.listJobPositions(),
        referencesApi.listSalaryStructures(),
        referencesApi.listWorkingSchedules(),
      ]);

      if (contractsRes.ok && (contractsRes.data?.contracts || contractsRes.contracts)) {
        setContracts(contractsRes.data?.contracts || contractsRes.contracts || []);
      }
      if (empRes.ok && (empRes.data?.employees || empRes.employees)) {
        setEmployees(empRes.data?.employees || empRes.employees || []);
      }
      if (deptRes.ok && (deptRes.data?.departments || deptRes.departments)) {
        setDepartments(deptRes.data?.departments || deptRes.departments || []);
      }
      if (posRes.ok && (posRes.data?.jobPositions || posRes.jobPositions)) {
        setJobPositions(posRes.data?.jobPositions || posRes.jobPositions || []);
      }
      if (strRes.ok && (strRes.data?.salaryStructures || strRes.salaryStructures)) {
        setSalaryStructures(strRes.data?.salaryStructures || strRes.salaryStructures || []);
      }
      if (schRes.ok && (schRes.data?.workingSchedules || schRes.workingSchedules)) {
        setWorkingSchedules(schRes.data?.workingSchedules || schRes.workingSchedules || []);
      }
    } catch (err) {
      console.error("Failed to load contracts data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeFilterId, selectedDepartment, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (contract) => {
    if (
      !window.confirm(
        `Are you sure you want to delete contract "${contract.contractReference}" for ${
          contract.employee?.fullName || "this employee"
        }?`
      )
    ) {
      return;
    }

    try {
      const res = await contractsApi.deleteContract(contract._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Contract "${contract.contractReference}" deleted successfully.`,
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete contract",
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

  // Metrics
  const metrics = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.status === "Active").length;
    const activePayrollCost = contracts
      .filter((c) => c.status === "Active")
      .reduce((sum, c) => sum + (Number(c.wagePerMonth) || 0), 0);

    return { total, active, activePayrollCost };
  }, [contracts]);

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  return (
    <PageContainer
      title="Employment Contracts"
      description="Manage employment terms, base compensation, wage structures, and validity periods"
      breadcrumbs={[{ label: "Contracts" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh list"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingContract(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Contract</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Filter Alert Banner when navigating from employee profile */}
        {filteredEmployee && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-900 font-semibold">
              <User className="w-4 h-4 text-indigo-600" />
              <span>
                Filtering contracts for employee:{" "}
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
              Show All Contracts
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Contracts
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Contracts
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{metrics.active}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Monthly Payroll Base
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ${metrics.activePayrollCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters Controls */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {(selectedDepartment || selectedStatus || employeeFilterId) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDepartment("");
                  setSelectedStatus("");
                  if (employeeFilterId) clearEmployeeFilter();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Contracts Table */}
        <ContractListTable
          contracts={contracts}
          isLoading={isLoading}
          canWrite={canWrite}
          onEdit={(contract) => {
            setEditingContract(contract);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      {/* Contract Form Modal */}
      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContract(null);
        }}
        initialData={editingContract}
        preselectedEmployeeId={employeeFilterId}
        onSuccess={() => {
          loadData();
        }}
        employees={employees}
        departments={departments}
        jobPositions={jobPositions}
        salaryStructures={salaryStructures}
        workingSchedules={workingSchedules}
      />
    </PageContainer>
  );
}
