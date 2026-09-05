import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Eye,
  DollarSign,
  ArrowRight,
  Printer,
  Calendar,
} from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import { PayslipStatusBadge } from "./PayrunStatusBadge";
import payslipsApi from "../../../api/payslips";

export default function PayslipListTable({
  payslips = [],
  isLoading = false,
  showEmployeeColumn = true,
}) {
  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleDownloadPdf = (e, payslipId) => {
    e.stopPropagation();
    window.open(payslipsApi.getPdfUrl(payslipId), "_blank");
  };

  const columns = [];

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
      key: "period",
      header: "Pay Period",
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
            <span className="font-semibold text-slate-800">{start}</span>
            <span className="text-slate-400 mx-1">→</span>
            <span className="font-semibold text-slate-800">{end}</span>
          </div>
        );
      },
    },
    {
      key: "grossSalary",
      header: "Gross Earnings",
      sortable: true,
      accessor: (row) => row.grossSalary,
      render: (gross) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          ₹{(Number(gross) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "totalDeductions",
      header: "Deductions",
      sortable: true,
      accessor: (row) => row.totalDeductions,
      render: (ded) => (
        <span className="font-mono text-xs font-bold text-rose-600">
          -₹{(Number(ded) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "netSalary",
      header: "Net Payable",
      sortable: true,
      accessor: (row) => row.netSalary,
      render: (net) => (
        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          ₹{(Number(net) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-28",
      render: (status) => <PayslipStatusBadge status={status} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/payroll/payslips/${row._id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Inspect Payslip Breakdown"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={(e) => handleDownloadPdf(e, row._id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors shadow-2xs border border-indigo-100"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      ),
    }
  );

  return (
    <DataTable
      columns={columns}
      data={payslips}
      keyField="_id"
      searchPlaceholder="Search payslips..."
      isLoading={isLoading}
      emptyMessage="No payslips found"
      emptySubMessage="Compute a payrun batch to generate individual employee payslips."
    />
  );
}
