import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Users,
  Plus,
  List,
  LayoutGrid,
  Filter,
  CheckCircle2,
  Building2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import EmployeeListTable from "../components/EmployeeListTable";
import EmployeeKanbanBoard from "../components/EmployeeKanbanBoard";
import EmployeeFormModal from "../components/EmployeeFormModal";
import employeesApi from "../../../api/employees";
import referencesApi from "../../../api/references";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function EmployeesPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const canCreate = userRoles.some((r) => ROLE_GROUPS.HR_WRITE_ROLES.includes(r));

  const [viewMode, setViewMode] = useState("list"); // 'list' | 'kanban'
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [workingSchedules, setWorkingSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes, posRes, schRes] = await Promise.all([
        employeesApi.listEmployees({
          search: debouncedSearch || undefined,
          department: selectedDepartment || undefined,
          status: selectedStatus || undefined,
        }),
        referencesApi.listDepartments(),
        referencesApi.listJobPositions(),
        referencesApi.listWorkingSchedules(),
      ]);

      if (empRes.ok && (empRes.data?.employees || empRes.employees)) {
        setEmployees(empRes.data?.employees || empRes.employees || []);
      }
      if (deptRes.ok && (deptRes.data?.departments || deptRes.departments)) {
        setDepartments(deptRes.data?.departments || deptRes.departments || []);
      }
      if (posRes.ok && (posRes.data?.jobPositions || posRes.jobPositions)) {
        setJobPositions(posRes.data?.jobPositions || posRes.jobPositions || []);
      }
      if (schRes.ok && (schRes.data?.workingSchedules || schRes.workingSchedules)) {
        setWorkingSchedules(schRes.data?.workingSchedules || schRes.workingSchedules || []);
      }
    } catch (err) {
      console.error("Failed to load employees data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedDepartment, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Active").length;
    const deptsCount = new Set(
      employees.map((e) => e.department?._id || e.department).filter(Boolean)
    ).size;

    return { total, active, deptsCount };
  }, [employees]);

  return (
    <PageContainer
      title="Employee Master Directory"
      description="Central workforce database, organizational hierarchy, and employee master profiles"
      breadcrumbs={[{ label: "Employees" }]}
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

          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Employee</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* KPI Mini Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Workforce
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Employees
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
                Active Departments
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metrics.deptsCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-2xs">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search, Filters, and View Mode Controls */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search Box & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Real-time Search Box */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code or email..."
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
              <option value="Inactive">Inactive</option>
              <option value="Terminated">Terminated</option>
            </select>

            {(selectedDepartment || selectedStatus || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDepartment("");
                  setSelectedStatus("");
                  setSearchQuery("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Right: View Mode Toggle (List vs Kanban) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>

        {/* View Component */}
        {viewMode === "list" ? (
          <EmployeeListTable
            employees={employees}
            isLoading={isLoading}
          />
        ) : (
          <EmployeeKanbanBoard
            employees={employees}
            isLoading={isLoading}
            departments={departments}
          />
        )}
      </div>

      {/* Creation Modal */}
      <EmployeeFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
        departments={departments}
        jobPositions={jobPositions}
        workingSchedules={workingSchedules}
        candidateEmployees={employees}
      />
    </PageContainer>
  );
}

