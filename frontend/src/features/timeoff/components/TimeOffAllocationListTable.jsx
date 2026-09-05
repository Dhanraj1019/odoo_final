import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Calendar,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import TimeOffStatusBadge from "./TimeOffStatusBadge";

export default function TimeOffAllocationListTable({
  allocations = [],
  isLoading = false,
  onApprove = null,
  onEdit = null,
  onDelete = null,
  canWrite = false,
  canApprove = false,
}) {
  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const columns = [
    {
      key: "employee",
      header: "Employee",
      sortable: true,
      accessor: (row) => row.employee?.fullName || "",
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 shadow-2xs">
            {getInitials(row.employee?.fullName)}
          </div>
          <div className="min-w-0">
            {row.employee?._id ? (
              <Link
                to={`/employees/${row.employee._id}`}
                className="font-bold text-slate-900 text-xs truncate hover:text-indigo-600 transition-colors block"
              >
                {row.employee.fullName}
              </Link>
            ) : (
              <p className="font-bold text-slate-900 text-xs truncate">
                {row.employee?.fullName || "—"}
              </p>
            )}
            <p className="text-[11px] text-slate-400 font-mono">
              {row.employee?.employeeCode || ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "timeOffType",
      header: "Time Off Type",
      sortable: true,
      accessor: (row) => row.timeOffType?.name || "",
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{row.timeOffType?.name || "—"}</span>
          <span className="text-[11px] text-slate-400 block font-medium">
            Unit: {row.timeOffType?.unit || "Days"}
          </span>
        </div>
      ),
    },
    {
      key: "allocatedAmount",
      header: "Allocated",
      sortable: true,
      render: (amt, row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {(amt || 0).toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || "days"}
        </span>
      ),
    },
    {
      key: "takenAmount",
      header: "Taken",
      sortable: true,
      render: (taken, row) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          {(taken || 0).toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || "days"}
        </span>
      ),
    },
    {
      key: "remainingAmount",
      header: "Remaining Quota",
      sortable: true,
      accessor: (row) => row.remainingAmount,
      render: (_, row) => {
        const allocated = Number(row.allocatedAmount) || 0;
        const taken = Number(row.takenAmount) || 0;
        const remaining = Math.max(0, allocated - taken);

        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            {remaining.toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || "days"}
          </span>
        );
      },
    },
    {
      key: "validity",
      header: "Validity Period",
      sortable: true,
      accessor: (row) => row.validFrom,
      render: (_, row) => {
        const fromStr = row.validFrom
          ? new Date(row.validFrom).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
        const toStr = row.validTo
          ? new Date(row.validTo).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";

        return (
          <span className="text-xs text-slate-600 font-medium">
            {fromStr} → {toStr}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (status) => <TimeOffStatusBadge status={status} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status === "Pending Approval" && canApprove && onApprove && (
            <button
              type="button"
              onClick={() => onApprove(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
              title="Approve Allocation"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Approve</span>
            </button>
          )}

          {canWrite && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  title="Edit Allocation"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete Allocation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={allocations}
      keyField="_id"
      searchPlaceholder="Search allocations by employee or leave type..."
      isLoading={isLoading}
      emptyMessage="No time off allocations found"
      emptySubMessage="Grant annual leave quotas to employees to enable leave submissions."
    />
  );
}
