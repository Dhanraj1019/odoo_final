import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FileSpreadsheet,
  Plus,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import PayrunListTable from "../components/PayrunListTable";
import payrunsApi from "../../../api/payruns";
import payrollApi from "../../../api/payroll";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function PayrunsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const canManage = userRoles.some((r) => ROLE_GROUPS.PAYROLL_ALL.includes(r));
  const canDelete = userRoles.some((r) => ROLE_GROUPS.PAYROLL_MANAGERS.includes(r));

  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStructure, setSelectedStructure] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runsRes, structsRes] = await Promise.all([
        payrunsApi.listPayruns({
          status: selectedStatus,
          salaryStructure: selectedStructure,
        }),
        payrollApi.listSalaryStructures({ status: "Active" }),
      ]);

      if (runsRes.ok && (runsRes.data?.payruns || runsRes.payruns)) {
        setPayruns(runsRes.data?.payruns || runsRes.payruns || []);
      }
      if (structsRes.ok && (structsRes.data?.salaryStructures || structsRes.salaryStructures)) {
        setStructures(structsRes.data?.salaryStructures || structsRes.salaryStructures || []);
      }
    } catch (err) {
      console.error("Failed to load payruns:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedStructure]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (payrun) => {
    if (
      !window.confirm(
        `Are you sure you want to delete draft payrun "${payrun.name}"?`
      )
    ) {
      return;
    }

    try {
      const res = await payrunsApi.deletePayrun(payrun._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Payrun "${payrun.name}" removed successfully.`,
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete payrun",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = payruns.length;
    const drafts = payruns.filter((p) => p.status === "Draft" || p.status === "Computed").length;
    const validated = payruns.filter((p) => p.status === "Validated").length;
    const paid = payruns.filter((p) => p.status === "Paid").length;

    return { total, drafts, validated, paid };
  }, [payruns]);

  return (
    <PageContainer
      title="Payrun Processing Console"
      description="Manage batch payroll cycles, compute employee earnings, validate disbursements, and dispatch payslips"
      breadcrumbs={[{ label: "Payroll", path: "/payroll/payruns" }, { label: "Payruns" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh payruns"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canManage && (
            <Link
              to="/payroll/payruns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Payrun Batch</span>
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Payruns
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                In-Progress
              </p>
              <p className="text-2xl font-black text-amber-600 tracking-tight">{metrics.drafts}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Validated
              </p>
              <p className="text-2xl font-black text-indigo-600 tracking-tight">
                {metrics.validated}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Disbursed / Paid
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {metrics.paid}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
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

            {/* Structure Filter */}
            <select
              value={selectedStructure}
              onChange={(e) => setSelectedStructure(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Salary Structures</option>
              {structures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            {(selectedStatus || selectedStructure) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("");
                  setSelectedStructure("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table of Batches */}
        <PayrunListTable
          payruns={payruns}
          isLoading={isLoading}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
      </div>
    </PageContainer>
  );
}
