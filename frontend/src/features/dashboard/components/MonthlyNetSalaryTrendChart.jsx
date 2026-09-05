import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function MonthlyNetSalaryTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-bold text-slate-700">No Historical Payroll Trend</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Historical 12-month net salary trends will appear as payroll batches are disbursed over time.
        </p>
      </div>
    );
  }

  // Format month labels (e.g. 2026-08 -> Aug 2026)
  const formatMonth = (str) => {
    if (!str) return "";
    const [y, m] = str.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, 1));
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const chartData = data.map((d) => ({
    rawMonth: d.month,
    month: formatMonth(d.month),
    amount: Number(d.amount) || 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-slate-800">
          <p className="font-bold">{item.month} ({item.rawMonth})</p>
          <p className="text-indigo-300 font-mono mt-0.5 font-bold">
            Total Net: ₹{item.amount.toLocaleString("en-IN")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">12-Month Net Salary Trend</h3>
          <p className="text-[11px] text-slate-400">Longitudinal disbursement trend and workforce cost evolution</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      <div className="w-full h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
              tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salaryGradient)"
              activeDot={{ r: 5, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
