import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  X,
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Hash,
} from "lucide-react";
import payrollApi from "../../../api/payroll";
import {
  SalaryRuleCategoryBadge,
  ComputationMethodBadge,
} from "./SalaryRuleBadge";
import { addNotification } from "../../notifications/notificationSlice";

export default function SalaryStructureFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
  availableRules = [],
}) {
  const dispatch = useDispatch();
  const isEditing = Boolean(initialData?._id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [candidateRuleId, setCandidateRuleId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "Active");

      const existingIds = Array.isArray(initialData.rules)
        ? initialData.rules.map((r) => (typeof r === "object" ? r._id : r))
        : [];
      setSelectedRuleIds(existingIds);
    } else {
      setName("");
      setDescription("");
      setStatus("Active");
      setSelectedRuleIds([]);
    }
    setCandidateRuleId("");
    setErrorMessage("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Lookup map of rules
  const rulesMap = new Map(availableRules.map((r) => [r._id, r]));

  // Selected rule objects in order
  const orderedRules = selectedRuleIds
    .map((id) => rulesMap.get(id))
    .filter(Boolean);

  // Unselected eligible rules
  const unselectedRules = availableRules.filter(
    (r) => !selectedRuleIds.includes(r._id) && r.status === "Active"
  );

  const handleAddRule = () => {
    if (!candidateRuleId) return;
    setSelectedRuleIds((prev) => [...prev, candidateRuleId]);
    setCandidateRuleId("");
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setSelectedRuleIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= selectedRuleIds.length - 1) return;
    setSelectedRuleIds((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemoveRule = (idToRemove) => {
    setSelectedRuleIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Structure name is required");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      rules: selectedRuleIds,
      status,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing) {
        res = await payrollApi.updateSalaryStructure(initialData._id, payload);
      } else {
        res = await payrollApi.createSalaryStructure(payload);
      }

      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Salary structure "${payload.name}" ${
              isEditing ? "updated" : "created"
            } successfully.`,
          })
        );
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.message || "Failed to save salary structure");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Salary Structure" : "Create Salary Structure"}
              </h2>
              <p className="text-xs text-slate-500">
                Assemble and sequence ordered rules for gross and net computation
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Structure Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Corporate Salary Structure"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard computation rules tree for all full-time executive staff"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Ordered Rule Sequencer */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Ordered Rule Sequencer ({orderedRules.length} Rules)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rules execute sequentially from top to bottom. Formulas may reference earlier rules.
                </p>
              </div>

              {/* Add Rule Control */}
              <div className="flex items-center gap-2">
                <select
                  value={candidateRuleId}
                  onChange={(e) => setCandidateRuleId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-[200px]"
                >
                  <option value="">Select rule to add...</option>
                  {unselectedRules.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={!candidateRuleId}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all disabled:opacity-40 disabled:hover:bg-indigo-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </div>

            {/* List of Ordered Rules */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-2 divide-y divide-slate-200/60 max-h-72 overflow-y-auto">
              {orderedRules.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No rules assigned yet. Use the dropdown above to add salary rules.
                </div>
              ) : (
                orderedRules.map((rule, index) => {
                  const isFirst = index === 0;
                  const isLast = index === orderedRules.length - 1;

                  return (
                    <div
                      key={rule._id}
                      className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-white/80 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                              {rule.code}
                            </span>
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {rule.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <SalaryRuleCategoryBadge category={rule.category} />
                            <ComputationMethodBadge method={rule.computationMethod} />
                          </div>
                        </div>
                      </div>

                      {/* Sequencer Buttons: Move Up / Down / Remove */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={isFirst}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white disabled:opacity-20 transition-colors shadow-2xs border border-transparent hover:border-slate-200"
                          title="Move Rule Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={isLast}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white disabled:opacity-20 transition-colors shadow-2xs border border-transparent hover:border-slate-200"
                          title="Move Rule Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveRule(rule._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors shadow-2xs border border-transparent hover:border-slate-200 ml-1"
                          title="Remove Rule from Structure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer */}
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
              {isSubmitting ? "Saving..." : isEditing ? "Update Salary Structure" : "Create Salary Structure"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
