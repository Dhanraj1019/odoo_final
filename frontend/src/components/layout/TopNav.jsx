import React, { useState, useRef, useEffect } from "react";
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
  FileText,
  Layers,
  Settings,
  User,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

export default function TopNav() {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isEmployeeOnly = userRoles.length === 1 && userRoles[0] === ROLES.EMPLOYEE;

  // Helper to check role permission
  const hasPermission = (allowedRoles = []) => {
    return userRoles.some((role) => allowedRoles.includes(role));
  };

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close "More" dropdown on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Dedicated Employee Portal Navigation
  if (isEmployeeOnly) {
    return (
      <nav className="flex items-center gap-1.5 flex-nowrap shrink-0">
        <Link
          to="/me"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            location.pathname === "/me"
              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <User className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="whitespace-nowrap">My Portal</span>
        </Link>
        <Link
          to="/attendance"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            location.pathname.startsWith("/attendance")
              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">My Attendance</span>
        </Link>
        <Link
          to="/time-off/requests"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            location.pathname.startsWith("/time-off")
              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">My Time Off</span>
        </Link>
      </nav>
    );
  }

  // Time Off Submenu Configuration
  const timeOffItems = [
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
  ];

  // Payroll Submenu Configuration
  const payrollItems = [
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
  ];

  const isTimeOffActive = location.pathname.startsWith("/time-off");
  const isPayrollActive = location.pathname.startsWith("/payroll");
  const isMoreActive = isTimeOffActive || isPayrollActive;

  // Management / Administrative Navigation
  return (
    <nav className="flex items-center gap-1 sm:gap-1.5 flex-nowrap justify-center">
      {/* 1. Dashboard */}
      {hasPermission(NAV_PERMISSIONS.DASHBOARD) && (
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
            location.pathname.startsWith("/dashboard")
              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="whitespace-nowrap">Dashboard</span>
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
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
            location.pathname.startsWith("/attendance")
              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">Attendance</span>
        </Link>
      )}

      {/* 5. Time Off ▾ (Visible on xl+ screens) */}
      {hasPermission(NAV_PERMISSIONS.TIME_OFF) && (
        <div className="hidden xl:block shrink-0">
          <NavDropdown
            label="Time Off"
            icon={Calendar}
            basePath="/time-off"
            items={timeOffItems}
          />
        </div>
      )}

      {/* 6. Payroll ▾ (Visible on xl+ screens) */}
      {hasPermission(NAV_PERMISSIONS.PAYROLL) && (
        <div className="hidden xl:block shrink-0">
          <NavDropdown
            label="Payroll"
            icon={DollarSign}
            basePath="/payroll"
            items={payrollItems}
          />
        </div>
      )}

      {/* 7. "More ▾" Dropdown (Visible on lg screens where horizontal width is tighter) */}
      <div className="block xl:hidden shrink-0" ref={moreRef}>
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer select-none ${
            isMoreActive
              ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
          aria-expanded={isMoreOpen}
        >
          <MoreHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="whitespace-nowrap">More</span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
              isMoreOpen ? "rotate-180 text-indigo-600" : "text-slate-400"
            }`}
          />
        </button>

        {isMoreOpen && (
          <div className="absolute right-auto mt-1.5 w-64 rounded-xl bg-white shadow-xl shadow-slate-900/10 border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto">
            {/* Time Off Section in More */}
            {hasPermission(NAV_PERMISSIONS.TIME_OFF) && (
              <div className="border-b border-slate-100 pb-1.5 mb-1.5">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Time Off</span>
                </div>
                {timeOffItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive =
                    location.pathname === item.path ||
                    (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                        isItemActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {ItemIcon && (
                        <ItemIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isItemActive ? "text-indigo-600" : "text-slate-400"
                          }`}
                        />
                      )}
                      <div className="truncate min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Payroll Section in More */}
            {hasPermission(NAV_PERMISSIONS.PAYROLL) && (
              <div>
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Payroll</span>
                </div>
                {payrollItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive =
                    location.pathname === item.path ||
                    (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                        isItemActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {ItemIcon && (
                        <ItemIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isItemActive ? "text-indigo-600" : "text-slate-400"
                          }`}
                        />
                      )}
                      <div className="truncate min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

