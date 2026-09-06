import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Clock,
  Plus,
  Edit,
  Archive,
  RefreshCw,
  Building,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import DataTable from "../../../components/table/DataTable";
import WorkingScheduleStatusBadge from "../components/WorkingScheduleStatusBadge";
import WorkingScheduleFormModal from "../components/WorkingScheduleFormModal";
import workingSchedulesApi from "../../../api/workingSchedules";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLE_GROUPS } from "../../../lib/constants";

export default function WorkingSchedulesPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const userRole = currentUser?.role;
  const canWrite = ROLE_GROUPS.HR_WRITE_ROLES.includes(userRole);

  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await workingSchedulesApi.listWorkingSchedules();
      if (res.ok && (res.data?.workingSchedules || res.workingSchedules)) {
        setSchedules(res.data?.workingSchedules || res.workingSchedules || []);
      }
    } catch (err) {
      console.error("Failed to load working schedules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleArchive = async (schedule) => {
    if (!window.confirm(`Are you sure you want to archive schedule "${schedule.name}"?`)) {
      return;
    }

    try {
      const res = await workingSchedulesApi.archiveWorkingSchedule(schedule._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `Schedule "${schedule.name}" has been archived.`,
          })
        );
        loadSchedules();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to archive schedule",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.status === "Active").length;
    const totalHours = schedules.reduce((sum, s) => sum + (s.totalWeeklyHours || 0), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : "0.0";
    return { total, active, avgHours };
  }, [schedules]);

  const columns = [
    {
      key: "name",
      header: "Schedule Name",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-400">{row.company || "My Company"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "days",
      header: "Operating Days",
      sortable: false,
      render: (_, row) => {
        const activeDays = Array.isArray(row.days) ? row.days.map((d) => d.day) : [];
        const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const fullDayMap = {
          Mon: "Monday",
          Tue: "Tuesday",
          Wed: "Wednesday",
          Thu: "Thursday",
          Fri: "Friday",
          Sat: "Saturday",
          Sun: "Sunday",
        };

        return (
          <div className="flex items-center gap-1">
            {shortDays.map((d) => {
              const isWorking = activeDays.includes(fullDayMap[d]);
              return (
                <span
                  key={d}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isWorking
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-slate-100 text-slate-300"
                  }`}
                  title={`${fullDayMap[d]}: ${isWorking ? "Working Day" : "Off"}`}
                >
                  {d}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "totalWeeklyHours",
      header: "Weekly Hours",
      sortable: true,
      render: (hrs) => (
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
          {(hrs || 0).toFixed(2)} hrs/wk
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (status) => <WorkingScheduleStatusBadge status={status} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingSchedule(row);
                  setIsModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                title="Edit Schedule"
              >
                <Edit className="w-4 h-4" />
              </button>
              {row.status === "Active" && (
                <button
                  type="button"
                  onClick={() => handleArchive(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                  title="Archive Schedule"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Working Schedules"
      description="Define weekly operational hours, shift templates, and break rules"
      breadcrumbs={[{ label: "Working Schedules" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadSchedules}
            title="Refresh list"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditingSchedule(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Schedule</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Schedules
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Templates
              </p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{metrics.active}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Avg Weekly Hours
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metrics.avgHours} <span className="text-xs font-normal text-slate-500">hrs/wk</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Schedules Table */}
        <DataTable
          columns={columns}
          data={schedules}
          keyField="_id"
          searchPlaceholder="Search schedules by name or company..."
          isLoading={isLoading}
          emptyMessage="No working schedules found"
          emptySubMessage="Create standard or customized weekly schedule templates."
        />
      </div>

      {/* Form Modal */}
      <WorkingScheduleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        initialData={editingSchedule}
        onSuccess={() => {
          loadSchedules();
        }}
      />
    </PageContainer>
  );
}
