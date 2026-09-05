import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import AppLayout from "../layouts/AppLayout";
import RequireAuth from "../routes/RequireAuth";
import RequireRole from "../routes/RequireRole";
import { ROLE_GROUPS, ROLES } from "../lib/constants";
import LoginPage from "../features/auth/components/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import EmployeesPage from "../features/employees/pages/EmployeesPage";
import EmployeeDetailPage from "../features/employees/pages/EmployeeDetailPage";
import MyProfilePage from "../features/employees/pages/MyProfilePage";
import ContractsPage from "../features/contracts/pages/ContractsPage";
import WorkingSchedulesPage from "../features/schedules/pages/WorkingSchedulesPage";
import AttendancePage from "../features/attendance/pages/AttendancePage";
import TimeOffRequestsPage from "../features/timeoff/pages/TimeOffRequestsPage";
import TimeOffTypesPage from "../features/timeoff/pages/TimeOffTypesPage";
import TimeOffAllocationsPage from "../features/timeoff/pages/TimeOffAllocationsPage";
import SalaryStructuresPage from "../features/payroll/pages/SalaryStructuresPage";
import SalaryRulesPage from "../features/payroll/pages/SalaryRulesPage";
import PayrunsPage from "../features/payroll/pages/PayrunsPage";
import PayrunNewWizardPage from "../features/payroll/pages/PayrunNewWizardPage";
import PayrunDetailPage from "../features/payroll/pages/PayrunDetailPage";
import PayslipsListPage from "../features/payroll/pages/PayslipsListPage";
import PayslipDetailPage from "../features/payroll/pages/PayslipDetailPage";
import UsersManagementPage from "../features/admin/pages/UsersManagementPage";

export const router = createBrowserRouter([
  // Public Auth Route
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },

  // Protected Application Routes
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <DashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "me",
        element: (
          <RequireRole allowedRoles={[ROLES.EMPLOYEE]}>
            <MyProfilePage />
          </RequireRole>
        ),
      },
      {
        path: "employees",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <EmployeesPage />
          </RequireRole>
        ),
      },
      {
        path: "employees/:id",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <EmployeeDetailPage />
          </RequireRole>
        ),
      },
      {
        path: "contracts",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <ContractsPage />
          </RequireRole>
        ),
      },
      {
        path: "working-schedules",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <WorkingSchedulesPage />
          </RequireRole>
        ),
      },
      {
        path: "attendance",
        element: <AttendancePage />,
      },
      {
        path: "time-off/requests",
        element: <TimeOffRequestsPage />,
      },
      {
        path: "time-off/types",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <TimeOffTypesPage />
          </RequireRole>
        ),
      },
      {
        path: "time-off/allocations",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.HR_MANAGEMENT}>
            <TimeOffAllocationsPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/structures",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.PAYROLL_ALL}>
            <SalaryStructuresPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/rules",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.PAYROLL_ALL}>
            <SalaryRulesPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/payruns",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.PAYROLL_ALL}>
            <PayrunsPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/payruns/new",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.PAYROLL_ALL}>
            <PayrunNewWizardPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/payruns/:id",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.PAYROLL_ALL}>
            <PayrunDetailPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/payslips",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.ALL_AUTHENTICATED}>
            <PayslipsListPage />
          </RequireRole>
        ),
      },
      {
        path: "payroll/payslips/:id",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.ALL_AUTHENTICATED}>
            <PayslipDetailPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireRole allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <UsersManagementPage />
          </RequireRole>
        ),
      },
    ],
  },

  // Fallback 404 Route
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">404 — Page Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">The page you requested does not exist.</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    ),
  },
]);

export default router;
