import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Layers, Plus, RefreshCw, Filter } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState("");

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
      title="Time Off Categories"
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
        {/* Filters */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filter Status:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <TimeOffTypeListTable
          types={types}
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
