import React from "react";
import { useSelector } from "react-redux";
import {
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  User,
  Edit,
  UserX,
  Clock,
  ShieldCheck,
} from "lucide-react";
import EmployeeStatusBadge from "./EmployeeStatusBadge";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function EmployeeProfileHeader({
  employee,
  onEdit = null,
  onTerminate = null,
  isSelfView = false,
}) {
  const currentUser = useSelector((state) => state.auth.user);
  const userRole = currentUser?.role;

  const canEdit =
    !isSelfView &&
    ROLE_GROUPS.HR_WRITE_ROLES.includes(userRole) &&
    typeof onEdit === "function";

  const canTerminate =
    !isSelfView &&
    ROLE_GROUPS.HR_WRITE_ROLES.includes(userRole) &&
    employee?.status !== "Terminated" &&
    typeof onTerminate === "function";

  if (!employee) return null;

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formattedDate = employee.dateOfJoining
    ? new Date(employee.dateOfJoining).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not specified";

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white border-4 border-indigo-50 shadow-md flex items-center justify-center font-black text-2xl tracking-wider shrink-0">
            {getInitials(employee.fullName)}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {employee.fullName}
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                {employee.employeeCode}
              </span>
              <EmployeeStatusBadge status={employee.status} />
              {isSelfView && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="w-3 h-3" />
                  Your Profile
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
              {employee.jobPosition?.name && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.jobPosition.name}</span>
                </div>
              )}
              {employee.department?.name && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.department.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee.employeeType || "Full-Time"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {(canEdit || canTerminate) && (
          <div className="flex items-center gap-2.5 self-start md:self-center">
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            {canTerminate && (
              <button
                type="button"
                onClick={onTerminate}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Terminate</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs">
            <Mail className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[11px]">Email Address</p>
            <p className="font-semibold text-slate-800 truncate">{employee.email}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs">
            <Phone className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[11px]">Phone</p>
            <p className="font-semibold text-slate-800 truncate">
              {employee.phone || "Not provided"}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs">
            <User className="w-4 h-4 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[11px]">Direct Manager</p>
            <p className="font-semibold text-slate-800 truncate">
              {employee.manager?.fullName || "None (Top Level)"}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[11px]">Date of Joining</p>
            <p className="font-semibold text-slate-800 truncate">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
