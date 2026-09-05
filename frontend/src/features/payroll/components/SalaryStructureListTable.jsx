import React from "react";
import { Layers, Edit, Trash2, ArrowRight } from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import { PayrollStatusBadge } from "./SalaryRuleBadge";

export default function SalaryStructureListTable({
  structures = [],
  isLoading = false,
  onEdit = null,
  onDelete = null,
  canWrite = false,
}) {
  const columns = [
    {
      key: "name",
      header: "Structure Name",
      sortable: true,
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">{name}</span>
            {row.description && (
              <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "rulesCount",
      header: "Rules",
      sortable: true,
      accessor: (row) => (Array.isArray(row.rules) ? row.rules.length : 0),
      width: "w-24",
      render: (_, row) => {
        const count = Array.isArray(row.rules) ? row.rules.length : 0;
        return (
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
            {count} {count === 1 ? "rule" : "rules"}
          </span>
        );
      },
    },
    {
      key: "rulesSequence",
      header: "Execution Sequence",
      sortable: false,
      render: (_, row) => {
        const rules = Array.isArray(row.rules) ? row.rules : [];
        if (rules.length === 0) {
          return <span className="text-xs text-slate-400 italic">No rules assigned</span>;
        }

        return (
          <div className="flex flex-wrap items-center gap-1.5 max-w-lg py-1">
            {rules.map((rule, idx) => {
              const code = typeof rule === "object" ? rule.code : String(rule);
              const isLast = idx === rules.length - 1;

              return (
                <React.Fragment key={typeof rule === "object" ? rule._id : idx}>
                  <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {code}
                  </span>
                  {!isLast && (
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 stroke-[2.5]" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );
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
                  title="Edit Structure"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  title="Delete Structure"
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
      data={structures}
      keyField="_id"
      searchPlaceholder="Search salary structures..."
      isLoading={isLoading}
      emptyMessage="No salary structures found"
      emptySubMessage="Create salary structures to sequence computation rules for employees and contracts."
    />
  );
}
