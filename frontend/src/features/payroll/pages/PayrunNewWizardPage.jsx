import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  Building2,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import payrunsApi from "../../../api/payruns";
import payrollApi from "../../../api/payroll";
import employeesApi from "../../../api/employees";
import { addNotification } from "../../notifications/notificationSlice";

export default function PayrunNewWizardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [step, setStep] = useState(1);

  // Step 1 Form Data
  const [name, setName] = useState("");
  const [salaryStructureId, setSalaryStructureId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeType, setEmployeeType] = useState("All");

  // Options & Metadata
  const [structures, setStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Step 2 Candidate Employees
  const [candidates, setCandidates] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load initial dropdown metadata
  useEffect(() => {
    async function loadMetadata() {
      setIsLoadingMetadata(true);
      try {
        const [structRes, deptRes] = await Promise.all([
          payrollApi.listSalaryStructures({ status: "Active" }),
          employeesApi.listDepartments ? employeesApi.listDepartments() : Promise.resolve({ ok: true, data: { departments: [] } }),
        ]);

        if (structRes.ok && (structRes.data?.salaryStructures || structRes.salaryStructures)) {
          const list = structRes.data?.salaryStructures || structRes.salaryStructures || [];
          setStructures(list);
          if (list.length > 0 && !salaryStructureId) {
            setSalaryStructureId(list[0]._id);
          }
        }
        if (deptRes.ok && (deptRes.data?.departments || deptRes.departments)) {
          setDepartments(deptRes.data?.departments || deptRes.departments || []);
        }

        // Default to current month start & end
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const firstDay = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
        const lastDay = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);

        setPeriodStart(firstDay);
        setPeriodEnd(lastDay);
        setName(`${now.toLocaleString("en-US", { month: "long" })} ${y} Payrun`);
      } catch (err) {
        console.error("Failed to load payrun metadata:", err);
      } finally {
        setIsLoadingMetadata(false);
      }
    }

    loadMetadata();
  }, []);

  const handleProceedToStep2 = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Payrun batch name is required");
      return;
    }
    if (!salaryStructureId) {
      setErrorMessage("Salary structure is required");
      return;
    }
    if (!periodStart || !periodEnd) {
      setErrorMessage("Start and end dates are required");
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setErrorMessage("Period Start date cannot be after Period End date");
      return;
    }

    setIsLoadingCandidates(true);
    try {
      const res = await payrunsApi.getEligibleEmployees({
        salaryStructure: salaryStructureId,
        periodStart,
        periodEnd,
        department: departmentId || undefined,
        employeeType: employeeType !== "All" ? employeeType : undefined,
      });

      if (res.ok && (res.data?.candidates || res.candidates)) {
        const found = res.data?.candidates || res.candidates || [];
        setCandidates(found);
        // By default select all eligible candidates
        const ids = found.map((c) => (c.employee?._id || c._id)).filter(Boolean);
        setSelectedEmployeeIds(ids);
        setStep(2);
      } else {
        setErrorMessage(res.message || "Failed to query candidate employees");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to query candidates");
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedEmployeeIds.length === candidates.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(candidates.map((c) => (c.employee?._id || c._id)).filter(Boolean));
    }
  };

  const handleToggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinalSubmit = async () => {
    setErrorMessage("");

    if (selectedEmployeeIds.length === 0) {
      setErrorMessage("At least one employee must be selected for the payrun batch");
      return;
    }

    const payload = {
      name: name.trim(),
      salaryStructure: salaryStructureId,
      periodStart,
      periodEnd,
      department: departmentId || null,
      employeeType,
      selectedEmployees: selectedEmployeeIds,
    };

    setIsSubmitting(true);
    try {
      const res = await payrunsApi.createPayrun(payload);
      if (res.ok) {
        const payrun = res.data?.payrun || res.payrun || res.data;
        dispatch(
          addNotification({
            type: "success",
            message: `Payrun "${payload.name}" created with ${selectedEmployeeIds.length} employees.`,
          })
        );
        navigate(`/payroll/payruns/${payrun._id}`);
      } else {
        setErrorMessage(res.message || "Failed to create payrun batch");
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create New Payrun Batch"
      description="2-Step payroll initialization wizard: configure calculation scope and select eligible workforce candidates"
      breadcrumbs={[
        { label: "Payroll", path: "/payroll/payruns" },
        { label: "Payruns", path: "/payroll/payruns" },
        { label: "New Wizard" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Wizard Progress Indicator */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4 w-full">
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${
                step === 1
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold"
                  : "text-slate-400 font-semibold"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                  step === 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                1
              </div>
              <span className="text-xs">Step 1: Scope & Period</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${
                step === 2
                  ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold"
                  : "text-slate-400 font-semibold"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                  step === 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                2
              </div>
              <span className="text-xs">Step 2: Candidate Employees</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: SCOPE & PERIOD */}
        {step === 1 && (
          <form
            onSubmit={handleProceedToStep2}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5"
          >
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Payroll Scope & Period Definition
              </h3>
              <p className="text-xs text-slate-500">
                Specify salary calculation cycle and structure model
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payrun Batch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. October 2026 Regular Payroll"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Salary Structure Model <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={salaryStructureId}
                  onChange={(e) => setSalaryStructureId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Salary Structure...</option>
                  {structures.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({Array.isArray(s.rules) ? s.rules.length : 0} rules)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Period Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Period End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Department (Optional)
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Filter Employment Type
                </label>
                <select
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="All">All Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                to="/payroll/payruns"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isLoadingCandidates}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
              >
                {isLoadingCandidates ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Eligible Employees...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Select Candidates</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SELECT CANDIDATE EMPLOYEES */}
        {step === 2 && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Candidate Employees ({selectedEmployeeIds.length} of {candidates.length} selected)
                </h3>
                <p className="text-xs text-slate-500">
                  Employees with valid active contracts matching period {periodStart} → {periodEnd}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors self-start sm:self-center"
              >
                {selectedEmployeeIds.length === candidates.length ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Select All ({candidates.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Candidate List */}
            {candidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl">
                No active employee contracts found matching this scope and structure.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto border border-slate-200/80 rounded-2xl bg-white">
                {candidates.map((cand, idx) => {
                  const emp = cand.employee || cand;
                  const empId = emp._id;
                  const isChecked = selectedEmployeeIds.includes(empId);
                  const wage = cand.contract?.wage || cand.activeContract?.wage || cand.contractWage;

                  return (
                    <div
                      key={empId || idx}
                      onClick={() => handleToggleEmployee(empId)}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? "bg-indigo-50/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {emp.employeeCode} • {emp.department?.name || "Unassigned"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {wage ? `₹${Number(wage).toLocaleString()}/mo` : "Active Contract"}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {emp.employeeType || "Full-Time"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Wizard Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Scope</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || selectedEmployeeIds.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing Payrun Batch...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Initialize Payrun Batch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
