import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  RefreshCw,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import DashboardFilterBar from "../components/DashboardFilterBar";
import DashboardKpiGrid from "../components/DashboardKpiGrid";
import SalaryCostByDepartmentChart from "../components/SalaryCostByDepartmentChart";
import MonthlyNetSalaryTrendChart from "../components/MonthlyNetSalaryTrendChart";
import PayrollAlertsPanel from "../components/PayrollAlertsPanel";
import AttendanceOverviewPanel from "../components/AttendanceOverviewPanel";
import TimeOffOverviewPanel from "../components/TimeOffOverviewPanel";
import DepartmentBreakdownTable from "../components/DepartmentBreakdownTable";
import dashboardApi from "../../../api/dashboard";
import employeesApi from "../../../api/employees";

export default function DashboardPage() {
  const currentUser = useSelector((state) => state.auth.user);

  // Filters State (default to current month YYYY-MM)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [period, setPeriod] = useState(currentMonth);
  const [department, setDepartment] = useState("");
  const [employeeType, setEmployeeType] = useState("All");

  // Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Load Departments for Filter Dropdown
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await employeesApi.listDepartments?.();
        if (res?.ok && (res.data?.departments || res.departments)) {
          setDepartments(res.data?.departments || res.departments || []);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    }
    loadDepts();
  }, []);

  // Fetch Dashboard Data
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await dashboardApi.getDashboard({
        period,
        department,
        employeeType,
      });

      if (res.ok && res.data) {
        setDashboardData(res.data);
      } else {
        setErrorMessage(res.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setErrorMessage(err.message || "An unexpected error occurred loading dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [period, department, employeeType]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const scope = dashboardData?.scope || "full";
  const kpis = dashboardData?.kpis || {};
  const charts = dashboardData?.charts || {};
  const alerts = dashboardData?.alerts || [];
  const attendanceOverview = dashboardData?.attendanceOverview || {};
  const timeOffOverview = dashboardData?.timeOffOverview || {};
  const departmentBreakdown = dashboardData?.departmentBreakdown || [];

  // Dynamic Role-Aware Title & Description
  const userRoles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const isAdmin = userRoles.includes("Admin");
  const isPayroll = userRoles.includes("HR Payroll Manager") || userRoles.includes("HR Payroll User");

  let dashboardTitle = "Executive Leadership Dashboard";
  if (!isAdmin && isPayroll) {
    dashboardTitle = "Payroll & Compensation Dashboard";
  } else if (!isAdmin && !isPayroll) {
    dashboardTitle = "Human Resources & Workforce Dashboard";
  }

  const dashboardDesc =
    scope === "full"
      ? "Real-time workforce payroll analytics, cost distributions, attendance, and operational intelligence"
      : "Workforce operations cockpit: attendance compliance, leave management, and organizational headcounts";

  return (
    <PageContainer
      title={dashboardTitle}
      description={dashboardDesc}
      breadcrumbs={[{ label: "Overview", path: "/dashboard" }, { label: dashboardTitle }]}
      actions={
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1.5 rounded-xl border shadow-2xs ${
              scope === "full"
                ? "bg-indigo-50 border-indigo-200/80 text-indigo-700"
                : "bg-cyan-50 border-cyan-200/80 text-cyan-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              Scope: <span className="uppercase font-extrabold">{scope === "full" ? "FULL (FINANCIAL & HR)" : "HR / WORKFORCE"}</span>
            </span>
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <DashboardFilterBar
          period={period}
          onPeriodChange={setPeriod}
          department={department}
          onDepartmentChange={setDepartment}
          employeeType={employeeType}
          onEmployeeTypeChange={setEmployeeType}
          departments={departments}
          onRefresh={loadDashboard}
          isLoading={isLoading}
        />

        {/* Error State */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="px-3 py-1 bg-white hover:bg-rose-100/50 border border-rose-300 text-rose-700 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dynamic Skeleton Loading State */}
        {isLoading && !dashboardData ? (
          <div className="space-y-6 animate-pulse">
            {/* KPI Skeletons */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${scope === "full" ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4"} gap-3.5 sm:gap-4`}>
              {[...Array(scope === "full" ? 6 : 4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 h-[125px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-slate-200 rounded-md w-24" />
                    <div className="w-8 h-8 rounded-xl bg-slate-100" />
                  </div>
                  <div>
                    <div className="h-7 bg-slate-200 rounded-md w-28 mb-1.5" />
                    <div className="h-2.5 bg-slate-100 rounded-md w-20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Skeleton (Only when scope === full) */}
            {scope === "full" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/70 rounded-2xl p-5 sm:p-6 h-[340px] flex flex-col justify-between">
                  <div className="h-4 bg-slate-200 rounded-md w-44" />
                  <div className="h-56 bg-slate-100 rounded-xl" />
                </div>
                <div className="bg-white border border-slate-200/70 rounded-2xl p-5 sm:p-6 h-[340px] flex flex-col justify-between">
                  <div className="h-4 bg-slate-200 rounded-md w-44" />
                  <div className="h-56 bg-slate-100 rounded-xl" />
                </div>
              </div>
            )}

            {/* Operational Panels Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200/70 rounded-2xl p-5 h-[260px] flex flex-col justify-between">
                  <div className="h-4 bg-slate-200 rounded-md w-36" />
                  <div className="h-32 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 1. Executive KPI Cards Grid */}
            <DashboardKpiGrid
              kpis={kpis}
              scope={scope}
              attendanceOverview={attendanceOverview}
              departmentBreakdown={departmentBreakdown}
            />

            {/* 2. Visualizations (Rendered when scope === "full") */}
            {scope === "full" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalaryCostByDepartmentChart data={charts.salaryCostByDepartment || []} />
                <MonthlyNetSalaryTrendChart data={charts.monthlyNetSalaryTrend || []} />
              </div>
            )}

            {/* 3. Operational Intelligence & Module Overviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AttendanceOverviewPanel attendance={attendanceOverview} />
              <TimeOffOverviewPanel timeOff={timeOffOverview} />
              <PayrollAlertsPanel alerts={alerts} />
            </div>

            {/* 4. Departmental Breakdown Table */}
            <DepartmentBreakdownTable data={departmentBreakdown} scope={scope} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
