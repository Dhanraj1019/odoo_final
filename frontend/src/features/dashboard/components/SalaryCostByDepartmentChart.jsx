import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Building2 } from "lucide-react";

const COLORS = [
  "#4f46e5", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#14b8a6", // Teal
];

export default function SalaryCostByDepartmentChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[320px] text-center">
        <Building2 className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-bold text-slate-700">No Department Salary Data</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Salary costs will appear here once payruns for the selected period are marked as Paid.
        </p>
      </div>
    );
  }

  // Clean label helper: remove raw database IDs and format cleanly
  const formatDeptLabel = (name) => {
    if (!name) return "General";
    // Strip 24-char hex ObjectIDs or technical Dept hashes
    let clean = name.replace(/\b[0-9a-fA-F]{24}\b/g, "").replace(/\bDept\d+\b/g, "").trim();
    if (!clean) clean = name;
    if (clean.length > 14) {
      return clean.slice(0, 12) + "…";
    }
    return clean;
  };

  // Format data
  const chartData = data.map((d) => ({
    name: d.department || "General",
    amount: Number(d.amount) || 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-xl border border-slate-800">
          <p className="font-bold text-slate-100">{item.name}</p>
          <p className="text-emerald-400 font-mono mt-1 font-bold text-sm">
            ₹{item.amount.toLocaleString("en-IN")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Salary Cost by Department</h3>
          <p className="text-[11px] text-slate-400">Net salary distribution across business units</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
      </div>

      <div className="w-full h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatDeptLabel}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
              tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc", opacity: 0.7 }} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
