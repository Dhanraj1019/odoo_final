import React from "react";
import { Calculator, Edit, Trash2, Code2, Hash } from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import {
  SalaryRuleCategoryBadge,
  ComputationMethodBadge,
  PayrollStatusBadge,
} from "./SalaryRuleBadge";

export default function SalaryRuleListTable({
  rules = [],
  isLoading = false,
  onEdit = null,
  onDelete = null,
  canWrite = false,
}) {
  const columns = [
    {
      key: "sequence",
      header: "Seq",
      sortable: true,
      width: "w-16",
      render: (seq) => (
        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {seq || 10}
        </span>
      ),
    },
    {
      key: "code",
      header: "Rule Code",
      sortable: true,
      render: (code) => (
        <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
          {code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Rule Name",
      sortable: true,
      render: (name, row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm">{name}</span>
          <span className="text-[11px] text-slate-400 block font-mono">
            {row.code}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (cat) => <SalaryRuleCategoryBadge category={cat} />,
    },
    {
      key: "computationMethod",
      header: "Computation Method",
      sortable: true,
      render: (method) => <ComputationMethodBadge method={method} />,
    },
    {
      key: "computationDetail",
      header: "Computation Value / Expression",
      sortable: false,
      render: (_, row) => {
        if (row.computationMethod === "Fixed") {
          return (
            <span className="font-mono text-xs font-bold text-slate-900">
              ₹{(Number(row.fixedAmount) || 0).toLocaleString()}
            </span>
          );
        }
        if (row.computationMethod === "Percentage") {
          return (
            <div className="text-xs">
              <span className="font-mono font-bold text-slate-900">
                {row.percentageValue}%
              </span>
              <span className="text-slate-500 ml-1">of</span>
              <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-1 border border-indigo-100">
                {row.percentageOf || "BASIC"}
              </span>
            </div>
          );
        }
        if (row.computationMethod === "Formula") {
          return (
            <span className="font-mono text-xs text-cyan-800 bg-cyan-50/80 px-2 py-0.5 rounded border border-cyan-200 max-w-[220px] truncate block" title={row.formulaExpression}>
              {row.formulaExpression || "—"}
            </span>
          );
        }
        return <span className="text-xs text-slate-400">—</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-28",
      render: (status) => <PayrollStatusBadge status={status} />,
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
                  title="Edit Rule"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete Rule"
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
      data={rules}
      keyField="_id"
      searchPlaceholder="Search rules by name or code..."
      isLoading={isLoading}
      emptyMessage="No salary rules found"
      emptySubMessage="Create salary components (Basic, HRA, PF, etc.) to construct payroll structures."
    />
  );
}
