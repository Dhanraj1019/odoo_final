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

  return (
    <PageContainer
      title="HR & Payroll Executive Dashboard"
      description={
        scope === "full"
          ? "Real-time workforce payroll analytics, cost distributions, attendance, and operational intelligence"
          : "Workforce operations cockpit: attendance compliance, leave management, and organizational headcounts"
      }
      breadcrumbs={[{ label: "Overview", path: "/dashboard" }, { label: "Executive Dashboard" }]}
      actions={
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            Scope: <span className="text-indigo-600 uppercase">{scope}</span>
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
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading Spinner Skeleton */}
        {isLoading && !dashboardData ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-bold text-slate-600">Aggregating workforce intelligence...</p>
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

            {/* 2. Visualizations (Only rendered when scope === "full") */}
            {scope === "full" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalaryCostByDepartmentChart data={charts.salaryCostByDepartment || []} />
                <MonthlyNetSalaryTrendChart data={charts.monthlyNetSalaryTrend || []} />
              </div>
            )}

            {/* 3. Operational Risk & Module Overviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PayrollAlertsPanel alerts={alerts} />
              <AttendanceOverviewPanel attendance={attendanceOverview} />
              <TimeOffOverviewPanel timeOff={timeOffOverview} />
            </div>

            {/* 4. Departmental Breakdown Table */}
            <DepartmentBreakdownTable data={departmentBreakdown} scope={scope} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
