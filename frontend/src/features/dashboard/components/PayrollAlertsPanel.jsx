import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CreditCard,
  Copy,
  FileWarning,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const ALERT_META = {
  missing_bank_details: {
    label: "Missing Bank Account Details",
    desc: "Employees with incomplete bank account numbers",
    link: "/employees",
    icon: CreditCard,
    color: "amber",
  },
  duplicate_payslip: {
    label: "Duplicate Payslip Records",
    desc: "Multiple payslips generated for same employee in period",
    link: "/payroll/payslips",
    icon: Copy,
    color: "rose",
  },
  no_active_contract: {
    label: "Missing Active Contracts",
    desc: "Employees with expired or missing active contract",
    link: "/contracts",
    icon: FileWarning,
    color: "rose",
  },
  pending_payruns: {
    label: "Pending Payrun Batches",
    desc: "Draft or computed payruns awaiting validation & payment",
    link: "/payroll/payruns",
    icon: Clock,
    color: "indigo",
  },
};

export default function PayrollAlertsPanel({ alerts = [] }) {
  // Filter for alerts with count > 0, or show clean zero-alert state
  const activeAlerts = alerts.filter((a) => (a.count || 0) > 0);

  const getSeverityClasses = (color, hasIssues) => {
    if (!hasIssues) {
      return {
        card: "bg-slate-50/50 border-slate-100 opacity-70",
        icon: "bg-slate-100 text-slate-400",
        badge: "bg-slate-200 text-slate-600",
      };
    }
    switch (color) {
      case "amber":
        return {
          card: "bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/70",
          icon: "bg-amber-100 text-amber-700",
          badge: "bg-amber-500 text-white shadow-2xs",
        };
      case "indigo":
        return {
          card: "bg-indigo-50/40 border-indigo-200/80 hover:bg-indigo-50/70",
          icon: "bg-indigo-100 text-indigo-700",
          badge: "bg-indigo-600 text-white shadow-2xs",
        };
      case "rose":
      default:
        return {
          card: "bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70",
          icon: "bg-rose-100 text-rose-700",
          badge: "bg-rose-600 text-white shadow-2xs",
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
              activeAlerts.length > 0
                ? "bg-amber-50 border-amber-100 text-amber-600"
                : "bg-slate-50 border-slate-100 text-slate-500"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operational Alerts</h3>
              <p className="text-[11px] text-slate-400">Compliance & pending action items</p>
            </div>
          </div>
          {activeAlerts.length > 0 ? (
            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
              {activeAlerts.length} {activeAlerts.length === 1 ? "flag" : "flags"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Clean
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {alerts.map((alert, idx) => {
            const meta = ALERT_META[alert.type] || {
              label: alert.type.replace(/_/g, " "),
              desc: "System operational flag",
              link: "/dashboard",
              icon: AlertTriangle,
              color: "slate",
            };
            const Icon = meta.icon;
            const count = alert.count || 0;
            const hasIssues = count > 0;
            const style = getSeverityClasses(meta.color, hasIssues);

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${style.card}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.icon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate" title={meta.label}>{meta.label}</p>
                    <p className="text-[11px] text-slate-400 truncate" title={meta.desc}>{meta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md ${style.badge}`}>
                    {count}
                  </span>
                  {hasIssues && (
                    <Link
                      to={meta.link}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
                      title="View details"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
