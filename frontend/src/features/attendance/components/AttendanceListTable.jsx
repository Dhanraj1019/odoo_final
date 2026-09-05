import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  FileCheck,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import AttendanceStatusBadge from "./AttendanceStatusBadge";

export default function AttendanceListTable({
  attendances = [],
  isLoading = false,
  showEmployeeColumn = true,
  onEdit = null,
  onDelete = null,
  canWrite = false,
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
      key: "date",
      header: "Date",
      sortable: true,
      accessor: (row) => row.date,
      render: (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        const formatted = d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const weekday = d.toLocaleDateString("en-US", { weekday: "short" });

        return (
          <div className="text-xs">
            <span className="font-bold text-slate-900">{formatted}</span>
            <span className="text-[11px] text-slate-400 block font-medium">{weekday}</span>
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
      key: "checkIn",
      header: "Check-In",
      sortable: true,
      render: (inDate) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {inDate
            ? new Date(inDate).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "checkOut",
      header: "Check-Out",
      sortable: true,
      render: (outDate) => (
        <span className="font-mono text-xs font-semibold text-slate-700">
          {outDate
            ? new Date(outDate).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "workedHours",
      header: "Worked Hours",
      sortable: true,
      render: (hrs) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
          {(hrs || 0).toFixed(2)} hrs
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-28",
      render: (status) => <AttendanceStatusBadge status={status} />,
    },
    {
      key: "audit",
      header: "Audit / Notes",
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2 text-xs">
          {row.isManualCorrection && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
              title={`Manually corrected${row.correctedBy?.name ? ` by ${row.correctedBy.name}` : ""}`}
            >
              <ShieldCheck className="w-3 h-3" />
              Manual
            </span>
          )}
          {row.notes && (
            <span
              className="truncate max-w-[140px] text-slate-500 italic text-[11px]"
              title={row.notes}
            >
              "{row.notes}"
            </span>
          )}
        </div>
      ),
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
                  title="Edit Attendance"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete Attendance"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    }
  );

  return (
    <DataTable
      columns={columns}
      data={attendances}
      keyField="_id"
      searchPlaceholder="Search attendance logs..."
      isLoading={isLoading}
      emptyMessage="No attendance records found"
      emptySubMessage="Records will appear as employees check in or when manual entries are recorded."
    />
  );
}
