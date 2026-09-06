import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  CalendarDays,
  Clock,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from "lucide-react";
import timeOffApi from "../../../api/timeOff";

export default function LeaveBalanceCard({
  employeeId = "",
  onRequestLeave = null,
  refreshTrigger = 0,
}) {
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBalances = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allocRes, typesRes] = await Promise.all([
        timeOffApi.listAllocations({
          employee: employeeId,
          status: "Approved",
        }),
        timeOffApi.listTypes({ status: "Active" }),
      ]);

      if (allocRes.ok && (allocRes.data?.allocations || allocRes.allocations)) {
        setAllocations(allocRes.data?.allocations || allocRes.allocations || []);
      }
      if (typesRes.ok) {
        setTypes(typesRes.data?.timeOffTypes || []);
      }
    } catch (err) {
      console.error("Failed to load leave balances:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances, refreshTrigger]);

  // Map type lookup map for quick, complete metadata resolution
  const typeMap = new Map();
  for (const t of types) {
    if (t && t._id) {
      typeMap.set(String(t._id), t);
    }
  }

  // Aggregate balance per allocated leave type
  const allocationsByType = new Map();

  for (const a of allocations) {
    if (!a || a.status !== "Approved") continue;

    const rawType = a.timeOffType;
    const typeId = String(rawType?._id || rawType || "");
    if (!typeId) continue;

    const typeObj = typeMap.get(typeId) || (typeof rawType === "object" ? rawType : null);
    if (!typeObj || !typeObj.name) continue;
    if (typeObj.status === "Archived" || typeObj.requiresAllocation === false) continue;

    if (!allocationsByType.has(typeId)) {
      allocationsByType.set(typeId, {
        type: typeObj,
        allocated: 0,
        taken: 0,
      });
    }

    const entry = allocationsByType.get(typeId);
    entry.allocated += Number(a.allocatedAmount) || 0;
    entry.taken += Number(a.takenAmount) || 0;
  }

  const balances = Array.from(allocationsByType.values()).map(({ type, allocated, taken }) => {
    const remaining = Math.max(0, allocated - taken);
    const percent =
      allocated > 0
        ? Math.min(100, Math.max(0, Math.round((remaining / allocated) * 100)))
        : 0;

    return {
      type,
      allocated,
      taken,
      remaining,
      percent,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Leave Quota & Balances
            </h3>
            <p className="text-xs text-slate-500">
              Approved annual quotas and remaining balance allowances
            </p>
          </div>
        </div>

        {onRequestLeave && (
          <button
            type="button"
            onClick={onRequestLeave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Time Off</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-medium">Calculating remaining quotas...</span>
        </div>
      ) : balances.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <CalendarDays className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">No Leave Quotas Configured</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Approved annual leave quotas for this employee will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((b) => {
            const unitStr = b.type.unit || "Days";

            const healthStyle =
              b.percent > 50
                ? {
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    bar: "bg-emerald-500",
                    label: "Healthy",
                  }
                : b.percent > 20
                ? {
                    badge: "bg-amber-50 text-amber-700 border-amber-200",
                    bar: "bg-amber-500",
                    label: "Running Low",
                  }
                : {
                    badge: "bg-rose-50 text-rose-700 border-rose-200",
                    bar: "bg-rose-500",
                    label: b.remaining === 0 ? "Exhausted" : "Low Balance",
                  };

            return (
              <div
                key={b.type._id}
                className="p-4.5 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-3.5 shadow-xs hover:border-indigo-200/90 hover:shadow-sm transition-all"
              >
                {/* Type Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {b.type.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          b.type.isPaid !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {b.type.isPaid !== false ? "Paid Leave" : "Unpaid Leave"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {unitStr}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${healthStyle.badge}`}
                  >
                    {healthStyle.label}
                  </span>
                </div>

                {/* Primary Remaining Balance Metric */}
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                      Remaining
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                      {b.remaining.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 lowercase">
                    {unitStr} left
                  </span>
                </div>

                {/* Quota Breakdown & Progress Bar */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-100/70">
                      <span className="text-[10px] text-indigo-600/80 block font-semibold uppercase">
                        Allocated
                      </span>
                      <span className="font-mono font-bold text-indigo-900">
                        {b.allocated.toFixed(1)} {unitStr.toLowerCase()}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100/70">
                      <span className="text-[10px] text-amber-600/80 block font-semibold uppercase">
                        Taken
                      </span>
                      <span className="font-mono font-bold text-amber-900">
                        {b.taken.toFixed(1)} {unitStr.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>Quota Availability</span>
                      <span className="font-mono">{b.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${healthStyle.bar}`}
                        style={{ width: `${b.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

