import React from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Edit,
  KeyRound,
  UserX,
  CheckCircle2,
  ShieldAlert,
  User,
  ExternalLink,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import { ROLES } from "../../../lib/constants";

const ROLE_BADGE_STYLES = {
  [ROLES.ADMIN]: "bg-purple-50 text-purple-700 border-purple-200",
  [ROLES.HR_MANAGER]: "bg-blue-50 text-blue-700 border-blue-200",
  [ROLES.HR_PAYROLL_MANAGER]: "bg-indigo-50 text-indigo-700 border-indigo-200",
  [ROLES.HR_PAYROLL_USER]: "bg-amber-50 text-amber-700 border-amber-200",
  [ROLES.EMPLOYEE]: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function UserListTable({
  users = [],
  isLoading = false,
  currentUser = null,
  onEdit = null,
  onResetPassword = null,
  onDeactivate = null,
  onReactivate = null,
}) {
  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const columns = [
    {
      key: "user",
      header: "User Account",
      sortable: true,
      accessor: (row) => row.fullName || "",
      render: (_, row) => {
        const isSelf = currentUser && (row._id === currentUser._id || row._id === currentUser.id);

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 shadow-2xs">
              {getInitials(row.fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs truncate">{row.fullName}</span>
                {isSelf && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md">
                    You
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono block truncate">
                {row.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "roles",
      header: "Assigned Roles",
      sortable: false,
      render: (_, row) => {
        const roles = Array.isArray(row.roles) ? row.roles : [];
        if (roles.length === 0) {
          return <span className="text-xs text-slate-400 italic">No roles</span>;
        }

        return (
          <div className="flex flex-wrap items-center gap-1">
            {roles.map((r) => {
              const badgeClass = ROLE_BADGE_STYLES[r] || "bg-slate-100 text-slate-700 border-slate-200";
              return (
                <span
                  key={r}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}
                >
                  {r}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "employee",
      header: "Linked Employee",
      sortable: true,
      accessor: (row) => row.employee?.fullName || "",
      render: (_, row) => {
        if (!row.employee) {
          return (
            <span className="text-[11px] font-medium text-slate-400 italic">
              Unlinked (Admin Only)
            </span>
          );
        }

        const emp = typeof row.employee === "object" ? row.employee : null;
        if (!emp) {
          return <span className="text-xs text-slate-600 font-mono">Linked ID</span>;
        }

        return (
          <Link
            to={`/employees/${emp._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors group"
          >
            <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
            <span>{emp.fullName}</span>
            {emp.employeeCode && (
              <span className="text-[10px] font-mono text-slate-400">({emp.employeeCode})</span>
            )}
            <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (row) => (row.isActive ? "Active" : "Inactive"),
      width: "w-28",
      render: (_, row) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
            row.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${row.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
          />
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created On",
      sortable: true,
      accessor: (row) => row.createdAt,
      width: "w-32",
      render: (date) => (
        <span className="text-xs text-slate-500 font-medium">
          {date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => {
        const isSelf = currentUser && (row._id === currentUser._id || row._id === currentUser.id);

        return (
          <div className="flex items-center justify-end gap-1">
            {/* Edit User */}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                title="Edit Account Details & Roles"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {/* Reset Password */}
            {onResetPassword && (
              <button
                type="button"
                onClick={() => onResetPassword(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                title="Reset Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Active / Deactivate with Self-Deactivation Protection */}
            {row.isActive ? (
              onDeactivate && (
                <button
                  type="button"
                  onClick={() => onDeactivate(row)}
                  disabled={isSelf}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isSelf
                      ? "text-slate-300 cursor-not-allowed opacity-40"
                      : "text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  }`}
                  title={isSelf ? "You cannot deactivate your own account" : "Deactivate Account"}
                >
                  <UserX className="w-4 h-4" />
                </button>
              )
            ) : (
              onReactivate && (
                <button
                  type="button"
                  onClick={() => onReactivate(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                  title="Reactivate Account"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      keyField="_id"
      searchPlaceholder="Search accounts by name or email..."
      isLoading={isLoading}
      emptyMessage="No user accounts found"
      emptySubMessage="Create user credentials to grant authorized access to PeoplePay360."
    />
  );
}
