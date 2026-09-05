import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  Edit,
  Trash2,
  User,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import ContractStatusBadge from "./ContractStatusBadge";

export default function ContractListTable({
  contracts = [],
  isLoading = false,
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
      key: "contractReference",
      header: "Reference",
      sortable: true,
      render: (ref, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
            {ref || "—"}
          </span>
          {row.status === "Active" && (
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
              title="Current Active Contract"
            />
          )}
        </div>
      ),
    },
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
      key: "department",
      header: "Department / Role",
      sortable: true,
      accessor: (row) => row.department?.name || "",
      render: (_, row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">
            {row.department?.name || <span className="text-slate-400 italic">Unassigned</span>}
          </p>
          <p className="text-[11px] text-slate-500">
            {row.jobPosition?.name || ""}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Validity Period",
      sortable: true,
      accessor: (row) => row.startDate,
      render: (_, row) => {
        const start = row.startDate
          ? new Date(row.startDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—";
        const end = row.endDate
          ? new Date(row.endDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Open-ended";

        return (
          <div className="text-xs font-medium text-slate-700">
            <span className="font-semibold">{start}</span>
            <span className="text-slate-400 mx-1">→</span>
            <span className={row.endDate ? "font-semibold" : "text-slate-500 italic"}>
              {end}
            </span>
          </div>
        );
      },
    },
    {
      key: "wagePerMonth",
      header: "Monthly Wage",
      sortable: true,
      render: (wage) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          ${Number(wage || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-[10px] text-slate-400 font-normal ml-0.5">/mo</span>
        </span>
      ),
    },
    {
      key: "salaryStructure",
      header: "Structure",
      sortable: true,
      accessor: (row) => row.salaryStructure?.name || "",
      render: (_, row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.salaryStructure?.name || <span className="text-slate-400 italic">Standard</span>}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-28",
      render: (status) => <ContractStatusBadge status={status} />,
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
                  title="Edit Contract"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete Contract"
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
      data={contracts}
      keyField="_id"
      searchPlaceholder="Search contracts by reference, employee name, department..."
      isLoading={isLoading}
      emptyMessage="No employment contracts found"
      emptySubMessage="Try adjusting your filters or register a new contract."
      rowClassName={(row) => (row.status === "Active" ? "bg-emerald-50/20" : "")}
    />
  );
}
