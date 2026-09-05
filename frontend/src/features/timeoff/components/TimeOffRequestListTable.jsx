import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Check,
  X,
  Trash2,
  AlertCircle,
  MessageSquare,
  Clock,
  ShieldCheck,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import TimeOffStatusBadge from "./TimeOffStatusBadge";

export default function TimeOffRequestListTable({
  requests = [],
  isLoading = false,
  showEmployeeColumn = true,
  onApprove = null,
  onRefuse = null,
  onDelete = null,
  canAction = false,
  canWrite = false,
}) {
  const [refusalModalTarget, setRefusalModalTarget] = useState(null);
  const [refusalReason, setRefusalReason] = useState("");

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenRefusal = (req) => {
    setRefusalReason("");
    setRefusalModalTarget(req);
  };

  const handleConfirmRefusal = () => {
    if (refusalModalTarget && onRefuse) {
      onRefuse(refusalModalTarget, refusalReason.trim());
      setRefusalModalTarget(null);
    }
  };

  const columns = [
    {
      key: "period",
      header: "Leave Period",
      sortable: true,
      accessor: (row) => row.startDate,
      render: (_, row) => {
        const start = row.startDate
          ? new Date(row.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
        const end = row.endDate
          ? new Date(row.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";

        return (
          <div className="text-xs">
            <span className="font-bold text-slate-900">{start}</span>
            <span className="text-slate-400 mx-1">→</span>
            <span className="font-bold text-slate-900">{end}</span>
          </div>
        );
      },
    },
  ];

  if (showEmployeeColumn) {
    columns.push({
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
    });
  }

  columns.push(
    {
      key: "timeOffType",
      header: "Leave Type",
      sortable: true,
      accessor: (row) => row.timeOffType?.name || "",
      render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{row.timeOffType?.name || "—"}</span>
          <span className="text-[11px] text-slate-400 block">
            {row.timeOffType?.isPaid ? "Paid Leave" : "Unpaid Leave"}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      render: (dur, row) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
          {(dur || 0).toFixed(1)} {row.timeOffType?.unit?.toLowerCase() || "days"}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Reason / Notes",
      sortable: false,
      render: (_, row) => (
        <div className="text-xs text-slate-600 max-w-[180px] truncate">
          {row.status === "Refused" && row.reason && (
            <span className="text-rose-600 font-medium">Refused: "{row.reason}"</span>
          )}
          {row.status !== "Refused" && (row.reason ? `"${row.reason}"` : <span className="text-slate-400 italic">—</span>)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-28",
      render: (status) => <TimeOffStatusBadge status={status} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status === "Submitted" && canAction && (
            <>
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  title="Approve Request"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Approve</span>
                </button>
              )}
              {onRefuse && (
                <button
                  type="button"
                  onClick={() => handleOpenRefusal(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors"
                  title="Refuse Request"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Refuse</span>
                </button>
              )}
            </>
          )}

          {(canWrite || row.status === "Submitted") && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              title="Delete Request"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={requests}
        keyField="_id"
        searchPlaceholder="Search leave requests..."
        isLoading={isLoading}
        emptyMessage="No time off requests found"
        emptySubMessage="Submitted leave requests will appear here for review and tracking."
      />

      {/* Refusal Reason Modal */}
      {refusalModalTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Refuse Time Off Request</h3>
                <p className="text-xs text-slate-500">
                  Provide an explanation for refusing this leave submission
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Refusal Reason / Note
              </label>
              <textarea
                rows={3}
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="e.g. Critical project milestone scheduled during this period..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefusalModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefusal}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Confirm Refusal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
