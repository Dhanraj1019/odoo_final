import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Layers,
  Plus,
  RefreshCw,
  Filter,
  Search,
  CheckCircle2,
  DollarSign,
  Award,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import TimeOffTypeListTable from "../components/TimeOffTypeListTable";
import TimeOffTypeFormModal from "../components/TimeOffTypeFormModal";
import timeOffApi from "../../../api/timeOff";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function TimeOffTypesPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
    ? [currentUser.role]
    : [];
  const canWrite = userRoles.some((role) => ROLE_GROUPS.HR_MANAGEMENT.includes(role));

  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client-side search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paidFilter, setPaidFilter] = useState("");
  const [allocationFilter, setAllocationFilter] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await timeOffApi.listTypes({ status: statusFilter });
      if (res.ok) {
        setTypes(res.data?.timeOffTypes || []);
      }
    } catch (err) {
      console.error("Failed to load time off types:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived KPI Metrics
  const metrics = useMemo(() => {
    const total = types.length;
    const active = types.filter((t) => t.status === "Active").length;
    const paid = types.filter((t) => t.isPaid !== false).length;
    const requiresAlloc = types.filter((t) => t.requiresAllocation !== false).length;

    return { total, active, paid, requiresAlloc };
  }, [types]);

  // Filtered Types for Table Display
  const displayedTypes = useMemo(() => {
    return types.filter((t) => {
      // Search match
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (t.name || "").toLowerCase().includes(q);
        const matchesUnit = (t.unit || "").toLowerCase().includes(q);
        if (!matchesName && !matchesUnit) return false;
      }

      // Paid / Unpaid filter
      if (paidFilter === "paid" && t.isPaid === false) return false;
      if (paidFilter === "unpaid" && t.isPaid !== false) return false;

      // Allocation filter
      if (allocationFilter === "required" && t.requiresAllocation === false) return false;
      if (allocationFilter === "not_required" && t.requiresAllocation !== false) return false;

      return true;
    });
  }, [types, searchQuery, paidFilter, allocationFilter]);

  const handleDelete = async (record) => {
    if (
      !window.confirm(
        `Are you sure you want to delete leave type "${record.name}"?`
      )
    ) {
      return;
    }

    try {
      const res = await timeOffApi.deleteType(record._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: "Leave category deleted successfully.",
          })
        );
        loadData();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to delete leave type",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  return (
    <PageContainer
      title="Time Off Types"
      description="Configure company leave policies, compensation types, and quota requirements"
      breadcrumbs={[{ label: "Time Off", path: "/time-off/requests" }, { label: "Leave Types" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Refresh types"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingType(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Leave Type</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Categories
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Categories
              </p>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">{metrics.active}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Paid Leave Types
              </p>
              <p className="text-2xl font-black text-violet-600 tracking-tight">{metrics.paid}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quota Required
              </p>
              <p className="text-2xl font-black text-amber-600 tracking-tight">
                {metrics.requiresAlloc}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Realtime Search Box */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by category name or unit..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>

            {/* Compensation Filter */}
            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Compensation</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            {/* Quota Filter */}
            <select
              value={allocationFilter}
              onChange={(e) => setAllocationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Allocation Rules</option>
              <option value="required">Quota Required</option>
              <option value="not_required">No Quota Limit</option>
            </select>
          </div>

          {(searchQuery || statusFilter || paidFilter || allocationFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setPaidFilter("");
                setAllocationFilter("");
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Data Table */}
        <TimeOffTypeListTable
          types={displayedTypes}
          isLoading={isLoading}
          onEdit={(t) => {
            setEditingType(t);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          canWrite={canWrite}
        />
      </div>

      {/* Create / Edit Modal */}
      <TimeOffTypeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingType(null);
        }}
        initialData={editingType}
        onSuccess={() => {
          loadData();
        }}
      />
    </PageContainer>
  );
}

