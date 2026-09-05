import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logout } from "../../features/auth/authSlice";
import { ROLES, NAV_PERMISSIONS } from "../../lib/constants";
import { apiFetch } from "../../lib/apiClient";
import { addNotification } from "../../features/notifications/notificationSlice";
import {
  X,
  ChevronDown,
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
  LogOut,
  User,
} from "lucide-react";

export default function MobileNavDrawer({ isOpen, onClose }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();

  if (!isOpen) return null;

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isEmployeeOnly = userRoles.length === 1 && userRoles[0] === ROLES.EMPLOYEE;

  const hasPermission = (allowedRoles = []) => {
    return userRoles.some((role) => allowedRoles.includes(role));
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      dispatch(
        addNotification({
          type: "info",
          message: "You have been logged out.",
        })
      );
    } catch (e) {
      console.error("Logout request error:", e);
    } finally {
      dispatch(logout());
      onClose();
      window.location.href = "/login";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              P
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight">
              PeoplePay<span className="text-indigo-600">360</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {isEmployeeOnly ? (
            <>
              <Link
                to="/me"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700"
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>My Portal</span>
              </Link>
              <Link
                to="/attendance"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>My Attendance</span>
              </Link>
              <Link
                to="/time-off/requests"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>My Time Off</span>
              </Link>
            </>
          ) : (
            <>
              {/* Dashboard */}
              {hasPermission(NAV_PERMISSIONS.DASHBOARD) && (
                <Link
                  to="/dashboard"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname.startsWith("/dashboard")
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* Employees Accordion */}
              {hasPermission(NAV_PERMISSIONS.EMPLOYEES) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("employees")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Employees</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === "employees" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSection === "employees" && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <Link
                        to="/employees"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Employee Directory
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Contracts Accordion */}
              {hasPermission(NAV_PERMISSIONS.CONTRACTS) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("contracts")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span>Contracts</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === "contracts" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSection === "contracts" && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <Link
                        to="/contracts"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Employment Contracts
                      </Link>
                      <Link
                        to="/working-schedules"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Working Schedules
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance */}
              {hasPermission(NAV_PERMISSIONS.ATTENDANCE) && (
                <Link
                  to="/attendance"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname.startsWith("/attendance")
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Attendance</span>
                </Link>
              )}

              {/* Time Off Accordion */}
              {hasPermission(NAV_PERMISSIONS.TIME_OFF) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("timeOff")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Time Off</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === "timeOff" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSection === "timeOff" && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <Link
                        to="/time-off/requests"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Leave Requests
                      </Link>
                      <Link
                        to="/time-off/allocations"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Leave Allocations
                      </Link>
                      <Link
                        to="/time-off/types"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Time Off Types
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Payroll Accordion */}
              {hasPermission(NAV_PERMISSIONS.PAYROLL) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("payroll")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>Payroll</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === "payroll" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSection === "payroll" && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <Link
                        to="/payroll/payruns"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Payruns
                      </Link>
                      <Link
                        to="/payroll/payslips"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        All Payslips
                      </Link>
                      <Link
                        to="/payroll/structures"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Salary Structures
                      </Link>
                      <Link
                        to="/payroll/rules"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Salary Rules
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Accordion */}
              {hasPermission(NAV_PERMISSIONS.ADMIN) && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("admin")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Admin</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expandedSection === "admin" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedSection === "admin" && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <Link
                        to="/admin/users"
                        onClick={onClose}
                        className="block py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        User Management
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {(user?.fullName || "User").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-indigo-600 font-semibold truncate">
                {userRoles.join(", ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
