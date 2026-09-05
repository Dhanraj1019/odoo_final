import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Calculator,
  Plus,
  Filter,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Percent,
  Code2,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import SalaryRuleListTable from "../components/SalaryRuleListTable";
import SalaryRuleFormModal from "../components/SalaryRuleFormModal";
import payrollApi from "../../../api/payroll";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function SalaryRulesPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const canWrite = userRoles.some((r) => ROLE_GROUPS.PAYROLL_MANAGERS.includes(r));

  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await payrollApi.listSalaryRules({
        category: selectedCategory,
        status: selectedStatus,
        computationMethod: selectedMethod,
      });

      if (res.ok && (res.data?.salaryRules || res.salaryRules)) {
        setRules(res.data?.salaryRules || res.salaryRules || []);
      }
    } catch (err) {
      console.error("Failed to load salary rules:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus, selectedMethod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (rule) => {
    if (
      !window.confirm(
        `Are you sure you want to delete salary rule "${rule.name}" (${rule.code})?`
      )
    ) {
      return;
    }

    try {
      const res = await payrollApi.deleteSalaryRule(rule._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Salary rule "${rule.name}" deleted successfully.`,
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete salary rule",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // Metrics KPI summary
  const metrics = useMemo(() => {
    const total = rules.length;
    const allowances = rules.filter((r) => r.category === "Allowance").length;
    const deductions = rules.filter((r) => r.category === "Deduction").length;
    const formulas = rules.filter((r) => r.computationMethod === "Formula").length;

    return { total, allowances, deductions, formulas };
  }, [rules]);

  return (
    <PageContainer
      title="Salary Rules Engine"
      description="Configure gross, allowance, and deduction computation components for payroll structures"
      breadcrumbs={[{ label: "Payroll", path: "/payroll/rules" }, { label: "Salary Rules" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh rules"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingRule(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Salary Rule</span>
            </button>
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
                Total Rules
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Calculator className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Allowances
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {metrics.allowances}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Deductions
              </p>
              <p className="text-2xl font-black text-rose-600 tracking-tight">
                {metrics.deductions}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <ArrowUpDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Formula Rules
              </p>
              <p className="text-2xl font-black text-cyan-700 tracking-tight font-mono">
                {metrics.formulas}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="Basic">Basic</option>
              <option value="Allowance">Allowance</option>
              <option value="Gross">Gross</option>
              <option value="Deduction">Deduction</option>
              <option value="Net">Net</option>
            </select>

            {/* Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Methods</option>
              <option value="Fixed">Fixed Amount</option>
              <option value="Percentage">Percentage</option>
              <option value="Formula">Formula Expression</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>

            {(selectedCategory || selectedMethod || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedMethod("");
                  setSelectedStatus("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Salary Rules Table */}
        <SalaryRuleListTable
          rules={rules}
          isLoading={isLoading}
          onEdit={(rule) => {
            setEditingRule(rule);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          canWrite={canWrite}
        />
      </div>

      {/* Form Modal */}
      <SalaryRuleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        initialData={editingRule}
        onSuccess={() => {
          loadData();
        }}
        existingRules={rules}
      />
    </PageContainer>
  );
}
