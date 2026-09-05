import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { ROLES, NAV_PERMISSIONS } from "../../lib/constants";
import NavDropdown from "./NavDropdown";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  FileText,
  Layers,
  Settings,
  UserCheck,
  Building,
  User,
} from "lucide-react";

export default function TopNav() {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isEmployeeOnly = userRoles.length === 1 && userRoles[0] === ROLES.EMPLOYEE;

  // Helper to check role permission
  const hasPermission = (allowedRoles = []) => {
    return userRoles.some((role) => allowedRoles.includes(role));
  };

  // Dedicated Employee Portal Navigation
  if (isEmployeeOnly) {
    return (
      <nav className="flex items-center gap-1">
        <Link
          to="/me"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === "/me"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <User className="w-4 h-4 text-indigo-600" />
          <span>My Portal</span>
        </Link>
        <Link
          to="/attendance"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname.startsWith("/attendance")
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>My Attendance</span>
        </Link>
        <Link
          to="/time-off/requests"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname.startsWith("/time-off")
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>My Time Off</span>
        </Link>
      </nav>
    );
  }

  // Management / Administrative Navigation
  return (
    <nav className="flex items-center gap-1">
      {/* 1. Dashboard */}
      {hasPermission(NAV_PERMISSIONS.DASHBOARD) && (
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname.startsWith("/dashboard")
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-600" />
          <span>Dashboard</span>
        </Link>
      )}

      {/* 2. Employees ▾ */}
      {hasPermission(NAV_PERMISSIONS.EMPLOYEES) && (
        <NavDropdown
          label="Employees"
          icon={Users}
          basePath="/employees"
          items={[
            {
              label: "Employee Directory",
              path: "/employees",
              icon: Users,
              description: "Active workforce records",
            },
          ]}
        />
      )}

      {/* 3. Contracts ▾ */}
      {hasPermission(NAV_PERMISSIONS.CONTRACTS) && (
        <NavDropdown
          label="Contracts"
          icon={Briefcase}
          basePath="/contracts"
          items={[
            {
              label: "Employment Contracts",
              path: "/contracts",
              icon: Briefcase,
              description: "Terms & compensation",
            },
            {
              label: "Working Schedules",
              path: "/working-schedules",
              icon: Clock,
              description: "Shift & weekly hours",
            },
          ]}
        />
      )}

      {/* 4. Attendance */}
      {hasPermission(NAV_PERMISSIONS.ATTENDANCE) && (
        <Link
          to="/attendance"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname.startsWith("/attendance")
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Attendance</span>
        </Link>
      )}

      {/* 5. Time Off ▾ */}
      {hasPermission(NAV_PERMISSIONS.TIME_OFF) && (
        <NavDropdown
          label="Time Off"
          icon={Calendar}
          basePath="/time-off"
          items={[
            {
              label: "Leave Requests",
              path: "/time-off/requests",
              icon: Calendar,
              description: "Approvals & requests",
            },
            ...(hasPermission([ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER])
              ? [
                  {
                    label: "Leave Allocations",
                    path: "/time-off/allocations",
                    icon: Layers,
                    description: "Employee quota balances",
                  },
                  {
                    label: "Time Off Types",
                    path: "/time-off/types",
                    icon: Settings,
                    description: "Leave categories & rules",
                  },
                ]
              : []),
          ]}
        />
      )}

      {/* 6. Payroll ▾ */}
      {hasPermission(NAV_PERMISSIONS.PAYROLL) && (
        <NavDropdown
          label="Payroll"
          icon={DollarSign}
          basePath="/payroll"
          items={[
            {
              label: "Payrun Processing",
              path: "/payroll/payruns",
              icon: DollarSign,
              description: "Batch compute & payments",
            },
            {
              label: "All Payslips",
              path: "/payroll/payslips",
              icon: FileText,
              description: "Salary slips & PDF exports",
            },
            {
              label: "Salary Structures",
              path: "/payroll/structures",
              icon: Layers,
              description: "Rule execution templates",
            },
            {
              label: "Salary Rules",
              path: "/payroll/rules",
              icon: Settings,
              description: "Formula & calculation rules",
            },
          ]}
        />
      )}

      {/* 7. Admin ▾ */}
      {hasPermission(NAV_PERMISSIONS.ADMIN) && (
        <NavDropdown
          label="Admin"
          icon={Shield}
          basePath="/admin"
          items={[
            {
              label: "User Management",
              path: "/admin/users",
              icon: UserCheck,
              description: "System accounts & roles",
            },
          ]}
        />
      )}
    </nav>
  );
}
