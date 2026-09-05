import React from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Calendar,
  Users,
  Layers,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import { PayrunStatusBadge } from "./PayrunStatusBadge";

export default function PayrunListTable({
  payruns = [],
  isLoading = false,
  onDelete = null,
  canDelete = false,
}) {
  const columns = [
    {
      key: "name",
      header: "Payrun Batch Name",
      sortable: true,
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <Link
              to={`/payroll/payruns/${row._id}`}
              className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors block"
            >
              {name}
            </Link>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {row._id ? row._id.slice(-6).toUpperCase() : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "period",
      header: "Payroll Period",
      sortable: true,
      accessor: (row) => row.periodStart,
      render: (_, row) => {
        const start = row.periodStart
          ? new Date(row.periodStart).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
        const end = row.periodEnd
          ? new Date(row.periodEnd).toLocaleDateString("en-US", {
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
    {
      key: "salaryStructure",
      header: "Salary Structure",
      sortable: true,
      accessor: (row) => row.salaryStructure?.name || "",
      render: (_, row) => (
        <span className="text-xs font-semibold text-slate-800">
          {row.salaryStructure?.name || "Standard Structure"}
        </span>
      ),
    },
    {
      key: "employees",
      header: "Employees",
      sortable: true,
      accessor: (row) => (Array.isArray(row.selectedEmployees) ? row.selectedEmployees.length : 0),
      render: (_, row) => {
        const count = Array.isArray(row.selectedEmployees) ? row.selectedEmployees.length : 0;
        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            {count} {count === 1 ? "staff" : "staff"}
          </span>
        );
      },
    },
    {
      key: "warnings",
      header: "Alerts",
      sortable: false,
      render: (_, row) => {
        const warnCount = Array.isArray(row.warnings) ? row.warnings.length : 0;
        if (warnCount === 0) {
          return <span className="text-xs text-slate-400 italic">None</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            {warnCount} {warnCount === 1 ? "issue" : "issues"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-28",
      render: (status) => <PayrunStatusBadge status={status} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/payroll/payruns/${row._id}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
          >
            <span>Console</span>
            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
          </Link>

          {canDelete && row.status === "Draft" && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
              title="Delete Draft Payrun"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payruns}
      keyField="_id"
      searchPlaceholder="Search payruns by name or structure..."
      isLoading={isLoading}
      emptyMessage="No payrun batches found"
      emptySubMessage="Create a new payrun batch to execute monthly payroll calculation and payslip generation."
    />
  );
}
