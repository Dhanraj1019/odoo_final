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
  Search,
  ArrowLeft,
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
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const canWrite = userRoles.some((r) => ROLE_GROUPS.HR_WRITE_ROLES.includes(r));

  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [workingSchedules, setWorkingSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStructures, setIsLoadingStructures] = useState(false);
  const [structuresError, setStructuresError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingStructures(true);
    setStructuresError("");
    try {
      const [contractsRes, empRes, deptRes, posRes, strRes, schRes] = await Promise.all([
        contractsApi.listContracts({
          employee: employeeFilterId || undefined,
          department: selectedDepartment || undefined,
          status: selectedStatus || undefined,
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
      } else if (!strRes.ok) {
        setStructuresError(strRes.message || "Failed to load salary structures");
      }
      if (schRes.ok && (schRes.data?.workingSchedules || schRes.workingSchedules)) {
        setWorkingSchedules(schRes.data?.workingSchedules || schRes.workingSchedules || []);
      }
    } catch (err) {
      console.error("Failed to load contracts data:", err);
      setStructuresError("Failed to load salary structures");
    } finally {
      setIsLoading(false);
      setIsLoadingStructures(false);
    }
  }, [employeeFilterId, selectedDepartment, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = async (contract) => {
    try {
      const res = await contractsApi.getContractById(contract._id);
      if (res.ok && (res.data?.contract || res.contract)) {
        setEditingContract(res.data?.contract || res.contract);
      } else {
        setEditingContract(contract);
      }
    } catch (err) {
      console.error("Failed to fetch contract details:", err);
      setEditingContract(contract);
    }
    setIsModalOpen(true);
  };

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

  // Client-side search filtering across reference, employee name, and code
  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return contracts;
    const q = searchQuery.toLowerCase().trim();
    return contracts.filter((c) => {
      const ref = (c.contractReference || "").toLowerCase();
      const empName = (c.employee?.fullName || "").toLowerCase();
      const empCode = (c.employee?.employeeCode || "").toLowerCase();
      return ref.includes(q) || empName.includes(q) || empCode.includes(q);
    });
  }, [contracts, searchQuery]);

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
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingContract(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
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
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3 text-indigo-950">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-indigo-700 block text-[11px] uppercase tracking-wider">
                  Employee Filter Active
                </span>
                <span className="font-bold text-sm text-indigo-950">
                  {filteredEmployee.fullName}
                </span>{" "}
                <span className="font-mono text-xs text-indigo-700">({filteredEmployee.employeeCode})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link
                to={`/employees/${filteredEmployee._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Profile</span>
              </Link>
              <button
                type="button"
                onClick={clearEmployeeFilter}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Show All Contracts</span>
              </button>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Contracts
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Contracts
              </p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{metrics.active}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Monthly Payroll Base
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ${metrics.activePayrollCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-2xs">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Filters Controls */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by reference, employee..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {(selectedDepartment || selectedStatus || employeeFilterId || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDepartment("");
                  setSelectedStatus("");
                  setSearchQuery("");
                  if (employeeFilterId) clearEmployeeFilter();
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Contracts Table */}
        <ContractListTable
          contracts={filteredContracts}
          isLoading={isLoading}
          canWrite={canWrite}
          onEdit={handleEdit}
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
        isLoadingStructures={isLoadingStructures}
        structuresError={structuresError}
      />
    </PageContainer>
  );
}

