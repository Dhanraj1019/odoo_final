import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  X,
  Calculator,
  Percent,
  HelpCircle,
  Sparkles,
  AlertCircle,
  Hash,
} from "lucide-react";
import payrollApi from "../../../api/payroll";
import { addNotification } from "../../notifications/notificationSlice";

const CATEGORIES = ["Basic", "Allowance", "Gross", "Deduction", "Net"];
const COMPUTATION_METHODS = ["Fixed", "Percentage", "Formula"];

const FORMULA_VARIABLES = [
  { name: "CONTRACT_WAGE", desc: "Base monthly wage from active contract" },
  { name: "BASIC", desc: "Calculated Basic Salary" },
  { name: "GROSS", desc: "Calculated Gross Earnings" },
  { name: "WORKED_DAYS", desc: "Actual present work days in period" },
  { name: "TOTAL_WORKING_DAYS", desc: "Scheduled standard work days" },
  { name: "PAID_LEAVE_DAYS", desc: "Approved paid time off days" },
  { name: "UNPAID_LEAVE_DAYS", desc: "Approved unpaid leave days" },
  { name: "OVERTIME_HOURS", desc: "Approved overtime duration" },
];

const FORMULA_FUNCTIONS = [
  { name: "ROUND(x, 2)", desc: "Round number to decimals" },
  { name: "MAX(a, b)", desc: "Maximum of two values" },
  { name: "MIN(a, b)", desc: "Minimum of two values" },
  { name: "ABS(x)", desc: "Absolute value" },
  { name: "IF(cond, trueVal, falseVal)", desc: "Conditional ternary evaluation" },
];

export default function SalaryRuleFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
  existingRules = [],
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("Allowance");
  const [sequence, setSequence] = useState(10);
  const [computationMethod, setComputationMethod] = useState("Fixed");
  const [status, setStatus] = useState("Active");

  // Conditional Method Fields
  const [fixedAmount, setFixedAmount] = useState("");
  const [percentageOf, setPercentageOf] = useState("BASIC");
  const [percentageValue, setPercentageValue] = useState("");
  const [formulaExpression, setFormulaExpression] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCode(initialData.code || "");
      setCategory(initialData.category || "Allowance");
      setSequence(initialData.sequence !== undefined ? initialData.sequence : 10);
      setComputationMethod(initialData.computationMethod || "Fixed");
      setStatus(initialData.status || "Active");
      setFixedAmount(initialData.fixedAmount !== null && initialData.fixedAmount !== undefined ? initialData.fixedAmount : "");
      setPercentageOf(initialData.percentageOf || "BASIC");
      setPercentageValue(initialData.percentageValue !== null && initialData.percentageValue !== undefined ? initialData.percentageValue : "");
      setFormulaExpression(initialData.formulaExpression || "");
    } else {
      setName("");
      setCode("");
      setCategory("Allowance");
      setSequence(10);
      setComputationMethod("Fixed");
      setStatus("Active");
      setFixedAmount("");
      setPercentageOf("BASIC");
      setPercentageValue("");
      setFormulaExpression("");
    }
    setErrorMessage("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
    setCode(val);
  };

  const insertVariable = (varName) => {
    setFormulaExpression((prev) => (prev ? `${prev} ${varName}` : varName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Salary rule name is required");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("Rule code is required (e.g. BASIC, HRA, PF)");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      sequence: Number(sequence) || 10,
      computationMethod,
      status,
    };

    if (computationMethod === "Fixed") {
      if (fixedAmount === "" || isNaN(Number(fixedAmount))) {
        setErrorMessage("Fixed amount is required for Fixed computation method");
        return;
      }
      payload.fixedAmount = Number(fixedAmount);
    } else if (computationMethod === "Percentage") {
      if (!percentageOf.trim()) {
        setErrorMessage("Percentage reference rule (e.g. BASIC or CONTRACT_WAGE) is required");
        return;
      }
      if (percentageValue === "" || isNaN(Number(percentageValue))) {
        setErrorMessage("Percentage value is required");
        return;
      }
      payload.percentageOf = percentageOf.trim().toUpperCase();
      payload.percentageValue = Number(percentageValue);
    } else if (computationMethod === "Formula") {
      if (!formulaExpression.trim()) {
        setErrorMessage("Formula expression is required for Formula computation method");
        return;
      }
      payload.formulaExpression = formulaExpression.trim();
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing) {
        res = await payrollApi.updateSalaryRule(initialData._id, payload);
      } else {
        res = await payrollApi.createSalaryRule(payload);
      }

      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Salary rule "${payload.name}" (${payload.code}) ${
              isEditing ? "updated" : "created"
            } successfully.`,
          })
        );
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message || "Failed to save salary rule");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Salary Rule" : "Create Salary Rule"}
              </h2>
              <p className="text-xs text-slate-500">
                Configure salary computation formulas, allowances, or deductions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rule Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. House Rent Allowance"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rule Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={handleCodeChange}
                placeholder="e.g. HRA, BASIC, PF"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sequence Order <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                min="1"
                step="1"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Computation Method Selection */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Computation Method <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-3 gap-3">
              {COMPUTATION_METHODS.map((method) => {
                const isSelected = computationMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setComputationMethod(method)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">{method}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {method === "Fixed"
                        ? "Fixed numerical currency value"
                        : method === "Percentage"
                        ? "% of prior rule or wage"
                        : "Mathematical expression"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Method Input Blocks */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            {computationMethod === "Fixed" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fixed Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  min="0"
                  step="0.01"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {computationMethod === "Percentage" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Percentage Value (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={percentageValue}
                    onChange={(e) => setPercentageValue(e.target.value)}
                    placeholder="e.g. 50"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Percentage Of (Target Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={percentageOf}
                    onChange={(e) => setPercentageOf(e.target.value.toUpperCase())}
                    placeholder="e.g. BASIC or CONTRACT_WAGE"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {computationMethod === "Formula" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Formula Expression <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formulaExpression}
                    onChange={(e) => setFormulaExpression(e.target.value)}
                    placeholder="e.g. BASIC * 0.5 or (GROSS - DEDUCTION)"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Safe Formula Helper Tokens */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Available Context Identifiers (Click to Insert):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FORMULA_VARIABLES.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => insertVariable(v.name)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 font-mono text-[11px] font-bold transition-colors shadow-2xs"
                        title={v.desc}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-1">
                    Allowed Math Functions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FORMULA_FUNCTIONS.map((fn) => (
                      <button
                        key={fn.name}
                        type="button"
                        onClick={() => insertVariable(fn.name)}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 text-cyan-800 font-mono text-[11px] font-bold transition-colors shadow-2xs"
                        title={fn.desc}
                      >
                        {fn.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Salary Rule" : "Create Salary Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
