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
  const userRole = currentUser?.role;
  const canCreate = ROLE_GROUPS.HR_WRITE_ROLES.includes(userRole);

  const [viewMode, setViewMode] = useState("list"); // 'list' | 'kanban'
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [workingSchedules, setWorkingSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes, posRes, schRes] = await Promise.all([
        employeesApi.listEmployees({
          department: selectedDepartment,
          status: selectedStatus,
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
  }, [selectedDepartment, selectedStatus]);

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
      description="Central workforce database, organizational hierarchy, and employee profiles"
      breadcrumbs={[{ label: "Employees" }]}
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

          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Workforce
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Employees
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
                Active Departments
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.deptsCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and View Mode Controls */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Dropdown Filters */}
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
              <option value="Inactive">Inactive</option>
              <option value="Terminated">Terminated</option>
            </select>

            {(selectedDepartment || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDepartment("");
                  setSelectedStatus("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* View Mode Toggle: List vs Kanban */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
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
