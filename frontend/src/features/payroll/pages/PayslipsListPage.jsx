import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FileText,
  Filter,
  RefreshCw,
  User,
  X,
  CreditCard,
  CheckCircle2,
  DollarSign,
  Download,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import PayslipListTable from "../components/PayslipListTable";
import payslipsApi from "../../../api/payslips";
import employeesApi from "../../../api/employees";
import { ROLES } from "../../../lib/constants";

export default function PayslipsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeFilterId = searchParams.get("employee") || "";

  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const isEmployeeOnly = userRoles.length > 0 && userRoles.every((r) => r === ROLES.EMPLOYEE);

  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slipsRes, empRes] = await Promise.all([
        payslipsApi.listPayslips({
          employee: employeeFilterId,
          status: selectedStatus,
        }),
        !isEmployeeOnly
          ? employeesApi.listEmployees()
          : Promise.resolve({ ok: true, data: { employees: [] } }),
      ]);

      if (slipsRes.ok && (slipsRes.data?.payslips || slipsRes.payslips)) {
        setPayslips(slipsRes.data?.payslips || slipsRes.payslips || []);
      }
      if (empRes.ok && (empRes.data?.employees || empRes.employees)) {
        setEmployees(empRes.data?.employees || empRes.employees || []);
      }
    } catch (err) {
      console.error("Failed to load payslips archive:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeFilterId, selectedStatus, isEmployeeOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered employee match
  const filteredEmployee = useMemo(() => {
    if (!employeeFilterId) return null;
    return employees.find((e) => e._id === employeeFilterId);
  }, [employeeFilterId, employees]);

  const clearEmployeeFilter = () => {
    searchParams.delete("employee");
    setSearchParams(searchParams);
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = payslips.length;
    const paid = payslips.filter((s) => s.status === "Paid").length;
    const netSum = payslips.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);

    return { total, paid, netSum };
  }, [payslips]);

  return (
    <PageContainer
      title={isEmployeeOnly ? "My Salary Payslips" : "Workforce Payslips Repository"}
      description={
        isEmployeeOnly
          ? "Access, inspect, and download monthly salary disbursement payslips and tax breakdowns"
          : "Historical repository of individual employee payslips across all payrun execution cycles"
      }
      breadcrumbs={[{ label: "Payroll", path: "/payroll/payslips" }, { label: "Payslips" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh payslips"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Deep link filter banner */}
        {!isEmployeeOnly && filteredEmployee && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-900 font-semibold">
              <User className="w-4 h-4 text-indigo-600" />
              <span>
                Filtering payslips for employee:{" "}
                <span className="font-bold underline">{filteredEmployee.fullName}</span> (
                {filteredEmployee.employeeCode})
              </span>
            </div>
            <button
              type="button"
              onClick={clearEmployeeFilter}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-indigo-700 hover:bg-indigo-100 font-bold text-xs shadow-2xs transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Show All Staff
            </button>
          </div>
        )}

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Payslips
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Paid / Disbursed
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{metrics.paid}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Net Amount
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{metrics.netSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters */}
        {!isEmployeeOnly && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter className="w-4 h-4 text-slate-400" />
                <span>Filters:</span>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Computed">Computed</option>
                <option value="Validated">Validated</option>
                <option value="Paid">Paid</option>
              </select>

              {(selectedStatus || employeeFilterId) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus("");
                    if (employeeFilterId) clearEmployeeFilter();
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Payslips Table */}
        <PayslipListTable
          payslips={payslips}
          isLoading={isLoading}
          showEmployeeColumn={!isEmployeeOnly}
        />
      </div>
    </PageContainer>
  );
}
