import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Download,
  ArrowLeft,
  User,
  Building2,
  Calendar,
  CreditCard,
  Clock,
  Printer,
  CheckCircle2,
  Layers,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import { PayslipStatusBadge } from "../components/PayrunStatusBadge";
import PayslipBreakdownTable from "../components/PayslipBreakdownTable";
import payslipsApi from "../../../api/payslips";

export default function PayslipDetailPage() {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPayslip() {
      setIsLoading(true);
      try {
        const res = await payslipsApi.getPayslipById(id);
        if (res.ok && (res.data?.payslip || res.payslip)) {
          setPayslip(res.data?.payslip || res.payslip);
        }
      } catch (err) {
        console.error("Failed to load payslip detail:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPayslip();
  }, [id]);

  const handleDownloadPdf = () => {
    window.open(payslipsApi.getPdfUrl(id), "_blank");
  };

  if (isLoading) {
    return (
      <PageContainer title="Payslip Breakdown" description="Loading detailed salary slip...">
        <div className="py-24 text-center text-slate-400 text-xs">Loading payslip record...</div>
      </PageContainer>
    );
  }

  if (!payslip) {
    return (
      <PageContainer title="Payslip Not Found">
        <div className="py-16 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">Payslip record does not exist</p>
          <Link
            to="/payroll/payslips"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl inline-block"
          >
            Back to Payslips
          </Link>
        </div>
      </PageContainer>
    );
  }

  const employee = payslip.employee || {};
  const startStr = payslip.periodStart ? new Date(payslip.periodStart).toLocaleDateString() : "";
  const endStr = payslip.periodEnd ? new Date(payslip.periodEnd).toLocaleDateString() : "";

  return (
    <PageContainer
      title={`Payslip: ${employee.fullName || "Staff"}`}
      description={`Period: ${startStr} → ${endStr} • Status: ${payslip.status}`}
      breadcrumbs={[
        { label: "Payroll", path: "/payroll/payslips" },
        { label: "Payslips", path: "/payroll/payslips" },
        { label: employee.fullName || "Detail" },
      ]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          <Link
            to="/payroll/payslips"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Summary Banner */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base shadow-2xs">
                {employee.fullName ? employee.fullName.slice(0, 2).toUpperCase() : "EM"}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900">{employee.fullName}</h2>
                  <PayslipStatusBadge status={payslip.status} />
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {employee.employeeCode} • {employee.department?.name || "Corporate"} •{" "}
                  {employee.jobPosition?.name || "Staff"}
                </p>
              </div>
            </div>

            <div className="text-right self-start sm:self-center">
              <span className="text-xs text-slate-500 font-semibold block">Net Disbursement</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                ₹{(Number(payslip.netSalary) || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <span className="text-slate-500 font-medium block">Worked Days</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {payslip.workedDays || 0} days
              </span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <span className="text-slate-500 font-medium block">Unpaid Leaves</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {payslip.unpaidLeaveDays || 0} days
              </span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <span className="text-slate-500 font-medium block">Gross Earnings</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                ₹{(Number(payslip.grossSalary) || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/60">
              <span className="text-slate-500 font-medium block">Total Deductions</span>
              <span className="font-mono text-sm font-bold text-rose-600">
                -₹{(Number(payslip.totalDeductions) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Rule-by-Rule Computation Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Rule Computation Line Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Model: {payslip.salaryStructure?.name || "Standard Structure"}
            </span>
          </div>

          <PayslipBreakdownTable lines={payslip.lines || []} />
        </div>
      </div>
    </PageContainer>
  );
}
