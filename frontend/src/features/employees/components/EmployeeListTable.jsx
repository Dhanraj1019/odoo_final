import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import DataTable from "../../../components/table/DataTable";
import EmployeeStatusBadge from "./EmployeeStatusBadge";

export default function EmployeeListTable({
  employees = [],
  isLoading = false,
  onSelectEmployee = null,
}) {
  const navigate = useNavigate();

  const handleRowClick = (employee) => {
    if (onSelectEmployee) {
      onSelectEmployee(employee);
    } else {
      navigate(`/employees/${employee._id}`);
    }
  };

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name = "") => {
    const colors = [
      "bg-indigo-100 text-indigo-700 border-indigo-200",
      "bg-blue-100 text-blue-700 border-blue-200",
      "bg-emerald-100 text-emerald-700 border-emerald-200",
      "bg-violet-100 text-violet-700 border-violet-200",
      "bg-amber-100 text-amber-700 border-amber-200",
      "bg-rose-100 text-rose-700 border-rose-200",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const columns = [
    {
      key: "fullName",
      header: "Employee",
      sortable: true,
      accessor: (row) => row.fullName,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${getAvatarColor(
              row.fullName
            )}`}
          >
            {getInitials(row.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate hover:text-indigo-600 transition-colors">
              {row.fullName}
            </p>
            <p className="text-xs text-slate-400 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "employeeCode",
      header: "Code",
      sortable: true,
      width: "w-28",
      render: (code) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          {code}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      accessor: (row) => row.department?.name || "",
      render: (_, row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.department?.name || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      key: "jobPosition",
      header: "Job Position",
      sortable: true,
      accessor: (row) => row.jobPosition?.name || "",
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {row.jobPosition?.name || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      key: "manager",
      header: "Manager",
      sortable: true,
      accessor: (row) => row.manager?.fullName || "",
      render: (_, row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          {row.manager ? (
            <>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[140px]">{row.manager.fullName}</span>
            </>
          ) : (
            <span className="text-slate-400 italic">—</span>
          )}
        </div>
      ),
    },
    {
      key: "employeeType",
      header: "Type",
      sortable: true,
      width: "w-28",
      render: (type) => (
        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {type || "Full-Time"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "w-32",
      render: (status) => <EmployeeStatusBadge status={status} />,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      align: "right",
      width: "w-12",
      render: () => (
        <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors inline-flex">
          <ChevronRight className="w-4 h-4" />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={employees}
      keyField="_id"
      searchable={false}
      isLoading={isLoading}
      emptyMessage="No employees found"
      emptySubMessage="Try adjusting your search criteria or clear your active filters."
      onRowClick={handleRowClick}
    />
  );
}
