import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Sparkles,
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
      if (typesRes.ok && (typesRes.data?.types || typesRes.types)) {
        setTypes(typesRes.data?.types || typesRes.types || []);
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

  // Aggregate balance per leave type
  const balances = types
    .filter((t) => t.requiresAllocation !== false)
    .map((type) => {
      const matchedAllocations = allocations.filter(
        (a) => (a.timeOffType?._id || a.timeOffType) === type._id
      );

      const allocated = matchedAllocations.reduce(
        (sum, a) => sum + (Number(a.allocatedAmount) || 0),
        0
      );
      const taken = matchedAllocations.reduce(
        (sum, a) => sum + (Number(a.takenAmount) || 0),
        0
      );
      const remaining = Math.max(0, allocated - taken);
      const percent = allocated > 0 ? Math.min(100, Math.round((remaining / allocated) * 100)) : 0;

      return {
        type,
        allocated,
        taken,
        remaining,
        percent,
      };
    });

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
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
        <div className="py-8 text-center text-slate-400 text-xs italic">
          No allocation-based leave types configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map((b) => {
            const unitStr = b.type.unit || "Days";

            return (
              <div
                key={b.type._id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between gap-3 shadow-2xs hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{b.type.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {b.type.isPaid ? "Paid Leave" : "Unpaid Leave"} • {unitStr}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {b.remaining} {unitStr.toLowerCase()} left
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Taken: {b.taken} {unitStr.toLowerCase()}</span>
                    <span>Total: {b.allocated} {unitStr.toLowerCase()}</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        b.percent > 50
                          ? "bg-emerald-500"
                          : b.percent > 20
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${b.percent}%` }}
                    />
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
