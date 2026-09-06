import React from "react";
import { Layers, CheckCircle2, Edit, Trash2, ShieldCheck, DollarSign, Calendar } from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import TimeOffStatusBadge from "./TimeOffStatusBadge";

export default function TimeOffTypeListTable({
  types = [],
  isLoading = false,
  onEdit = null,
  onDelete = null,
  canWrite = false,
}) {
  const columns = [
    {
      key: "name",
      header: "Leave Category",
      sortable: true,
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">{name}</span>
            <span className="text-[11px] text-slate-400 font-medium">
              Unit: {row.unit || "Days"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      sortable: true,
      render: (unit) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {unit || "Days"}
        </span>
      ),
    },
    {
      key: "isPaid",
      header: "Compensation",
      sortable: true,
      render: (isPaid) =>
        isPaid !== false ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Paid Leave
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            Unpaid Leave
          </span>
        ),
    },
    {
      key: "requiresAllocation",
      header: "Quota Allocation",
      sortable: true,
      render: (req) =>
        req !== false ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
            Quota Required
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">No Quota Limit</span>
        ),
    },
    {
      key: "requiresApproval",
      header: "Approval Policy",
      sortable: true,
      render: (req) =>
        req !== false ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50/70 px-2 py-0.5 rounded-md border border-amber-100">
            Manager Approval
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Auto-Approved
          </span>
        ),
    },
    {
      key: "affectsPayroll",
      header: "Payroll Impact",
      sortable: true,
      render: (affects) =>
        affects !== false ? (
          <span className="text-xs font-medium text-slate-700">Affects Payroll</span>
        ) : (
          <span className="text-xs text-slate-400">No Impact</span>
        ),
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
        <div className="flex items-center justify-end gap-1">
          {canWrite && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  title="Edit Type"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete Type"
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
      data={types}
      keyField="_id"
      searchPlaceholder="Search leave categories..."
      isLoading={isLoading}
      emptyMessage="No time off types found"
      emptySubMessage="Create standard leave categories (PTO, Sick Leave, etc.)."
    />
  );
}

