import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FileSpreadsheet,
  Calculator,
  ShieldCheck,
  CreditCard,
  Send,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Users,
  Calendar,
  Layers,
  CheckCircle2,
  Download,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import { PayrunStatusBadge } from "../components/PayrunStatusBadge";
import PayslipListTable from "../components/PayslipListTable";
import payrunsApi from "../../../api/payruns";
import payslipsApi from "../../../api/payslips";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const canOperate = userRoles.some((r) => ROLE_GROUPS.PAYROLL_ALL.includes(r));
  const canDelete = userRoles.some((r) => ROLE_GROUPS.PAYROLL_MANAGERS.includes(r));

  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionLabel, setActionLabel] = useState("");

  const loadPayrunData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runRes, slipsRes] = await Promise.all([
        payrunsApi.getPayrunById(id),
        payslipsApi.listPayslips({ payrun: id }),
      ]);

      if (runRes.ok && (runRes.data?.payrun || runRes.payrun)) {
        setPayrun(runRes.data?.payrun || runRes.payrun);
      }
      if (slipsRes.ok && (slipsRes.data?.payslips || slipsRes.payslips)) {
        setPayslips(slipsRes.data?.payslips || slipsRes.payslips || []);
      }
    } catch (err) {
      console.error("Failed to load payrun details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayrunData();
  }, [loadPayrunData]);

  // Compute Action
  const handleCompute = async () => {
    setIsProcessing(true);
    setActionLabel("Computing Salary Rules & Formulas...");
    try {
      const res = await payrunsApi.computePayrun(id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Payrun batch computed successfully. Payslips generated.",
          })
        );
        loadPayrunData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to compute payrun",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsProcessing(false);
      setActionLabel("");
    }
  };

  // Validate Action
  const handleValidate = async () => {
    if (!window.confirm("Validate and lock this payrun batch? This freezes payslip lines.")) {
      return;
    }
    setIsProcessing(true);
    setActionLabel("Validating and Freezing Payslips...");
    try {
      const res = await payrunsApi.validatePayrun(id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Payrun batch validated and locked.",
          })
        );
        loadPayrunData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to validate payrun",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsProcessing(false);
      setActionLabel("");
    }
  };

  // Mark Paid Action
  const handleMarkPaid = async () => {
    if (!window.confirm("Mark this payrun as paid and record disbursement?")) {
      return;
    }
    setIsProcessing(true);
    setActionLabel("Recording Salary Disbursements...");
    try {
      const res = await payrunsApi.markPaid(id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Payrun marked as Paid successfully.",
          })
        );
        loadPayrunData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to mark payrun as paid",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsProcessing(false);
      setActionLabel("");
    }
  };

  // Send Payslips Action
  const handleSendPayslips = async () => {
    if (!window.confirm("Send PDF payslips via email to all employees in this batch?")) {
      return;
    }
    setIsProcessing(true);
    setActionLabel("Dispatching Email Payslips via SMTP...");
    try {
      const res = await payrunsApi.sendPayslips(id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Payslips dispatched to employees via email.",
          })
        );
        loadPayrunData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to dispatch payslips",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    } finally {
      setIsProcessing(false);
      setActionLabel("");
    }
  };

  // Aggregated Totals
  const totals = useMemo(() => {
    const gross = payslips.reduce((sum, s) => sum + (Number(s.grossSalary) || 0), 0);
    const deductions = payslips.reduce((sum, s) => sum + (Number(s.totalDeductions) || 0), 0);
    const net = payslips.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);

    return { gross, deductions, net, count: payslips.length };
  }, [payslips]);

  if (isLoading && !payrun) {
    return (
      <PageContainer title="Payrun Processing Console" description="Loading batch data...">
        <div className="py-24 text-center text-slate-400 text-xs">Loading payrun cycle...</div>
      </PageContainer>
    );
  }

  if (!payrun) {
    return (
      <PageContainer title="Payrun Not Found">
        <div className="py-16 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">Payrun batch does not exist</p>
          <Link
            to="/payroll/payruns"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl inline-block"
          >
            Back to Payruns
          </Link>
        </div>
      </PageContainer>
    );
  }

  const status = payrun.status || "Draft";
  const startStr = payrun.periodStart ? new Date(payrun.periodStart).toLocaleDateString() : "";
  const endStr = payrun.periodEnd ? new Date(payrun.periodEnd).toLocaleDateString() : "";

  return (
    <PageContainer
      title={payrun.name}
      description={`Cycle Period: ${startStr} → ${endStr} • Model: ${payrun.salaryStructure?.name || "Standard Structure"}`}
      breadcrumbs={[
        { label: "Payroll", path: "/payroll/payruns" },
        { label: "Payruns", path: "/payroll/payruns" },
        { label: payrun.name },
      ]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadPayrunData}
            title="Refresh"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <Link
            to="/payroll/payruns"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Payruns</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Processing Lifecycle Action Bar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{payrun.name}</h2>
                <PayrunStatusBadge status={status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Selected Workforce: {payrun.selectedEmployees?.length || 0} Staff Candidates
              </p>
            </div>
          </div>

          {/* Action Lifecycle Buttons */}
          {canOperate && (
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {/* Compute Button */}
              {(status === "Draft" || status === "Computed") && (
                <button
                  type="button"
                  onClick={handleCompute}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{status === "Computed" ? "Re-Compute Batch" : "Compute Batch"}</span>
                </button>
              )}

              {/* Validate Button */}
              {status === "Computed" && (
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-900 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validate & Lock</span>
                </button>
              )}

              {/* Mark Paid Button */}
              {status === "Validated" && (
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Mark as Paid</span>
                </button>
              )}

              {/* Send Payslips Button */}
              {status === "Paid" && (
                <button
                  type="button"
                  onClick={handleSendPayslips}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Payslips (Email)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Processing Banner */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>{actionLabel}</span>
          </div>
        )}

        {/* Warnings Banner */}
        {Array.isArray(payrun.warnings) && payrun.warnings.length > 0 && (
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Payroll Calculation Warnings ({payrun.warnings.length} Detected)</span>
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-800">
              {payrun.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Payslips
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{totals.count}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Gross
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{totals.gross.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Calculator className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Deductions
              </p>
              <p className="text-2xl font-black text-rose-600 tracking-tight">
                -₹{totals.deductions.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Calculator className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Net Disbursement
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                ₹{totals.net.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Generated Payslips Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Generated Payslips for this Payrun
            </h3>
          </div>

          <PayslipListTable
            payslips={payslips}
            isLoading={isLoading}
            showEmployeeColumn={true}
          />
        </div>
      </div>
    </PageContainer>
  );
}
