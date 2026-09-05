import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Layers, Plus, Filter, RefreshCw, CheckCircle2, ListOrdered } from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import SalaryStructureListTable from "../components/SalaryStructureListTable";
import SalaryStructureFormModal from "../components/SalaryStructureFormModal";
import payrollApi from "../../../api/payroll";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function SalaryStructuresPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
  const canWrite = userRoles.some((r) => ROLE_GROUPS.PAYROLL_MANAGERS.includes(r));

  const [structures, setStructures] = useState([]);
  const [availableRules, setAvailableRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [structRes, rulesRes] = await Promise.all([
        payrollApi.listSalaryStructures({ status: selectedStatus }),
        payrollApi.listSalaryRules({ status: "Active" }),
      ]);

      if (structRes.ok && (structRes.data?.salaryStructures || structRes.salaryStructures)) {
        setStructures(structRes.data?.salaryStructures || structRes.salaryStructures || []);
      }
      if (rulesRes.ok && (rulesRes.data?.salaryRules || rulesRes.salaryRules)) {
        setAvailableRules(rulesRes.data?.salaryRules || rulesRes.salaryRules || []);
      }
    } catch (err) {
      console.error("Failed to load salary structures:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (structure) => {
    if (
      !window.confirm(
        `Are you sure you want to delete salary structure "${structure.name}"?`
      )
    ) {
      return;
    }

    try {
      const res = await payrollApi.deleteSalaryStructure(structure._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Salary structure "${structure.name}" deleted successfully.`,
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete salary structure",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = structures.length;
    const active = structures.filter((s) => s.status === "Active").length;
    const totalRulesAssigned = structures.reduce(
      (sum, s) => sum + (Array.isArray(s.rules) ? s.rules.length : 0),
      0
    );

    return { total, active, totalRulesAssigned };
  }, [structures]);

  return (
    <PageContainer
      title="Salary Structures"
      description="Assemble ordered execution rule trees to compute gross salaries, deductions, and net payouts"
      breadcrumbs={[{ label: "Payroll", path: "/payroll/structures" }, { label: "Structures" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh structures"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingStructure(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Salary Structure</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Structures
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Models
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {metrics.active}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Rule Links
              </p>
              <p className="text-2xl font-black text-indigo-600 tracking-tight">
                {metrics.totalRulesAssigned}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ListOrdered className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filter Status:</span>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>

            {selectedStatus && (
              <button
                type="button"
                onClick={() => setSelectedStatus("")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Structure List Table */}
        <SalaryStructureListTable
          structures={structures}
          isLoading={isLoading}
          onEdit={(structure) => {
            setEditingStructure(structure);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          canWrite={canWrite}
        />
      </div>

      {/* Structure Form Modal */}
      <SalaryStructureFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStructure(null);
        }}
        initialData={editingStructure}
        onSuccess={() => {
          loadData();
        }}
        availableRules={availableRules}
      />
    </PageContainer>
  );
}
