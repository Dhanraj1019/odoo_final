import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  CalendarCheck,
  CalendarDays,
  Award,
  ArrowUpRight,
} from "lucide-react";

/**
 * Smart Navigation Tabs for Related Employee Records
 * Direct deep-links with ?employee=<id> filter
 */
export default function RelatedRecordsTabs({ employee }) {
  if (!employee?._id) return null;

  const links = [
    {
      title: "Employment Contracts",
      description: "Wage, terms & salary structure",
      icon: FileText,
      color: "indigo",
      path: `/contracts?employee=${employee._id}`,
    },
    {
      title: "Attendance Records",
      description: "Daily check-ins & hours worked",
      icon: CalendarCheck,
      color: "emerald",
      path: `/attendance?employee=${employee._id}`,
    },
    {
      title: "Time Off Requests",
      description: "Leave submissions & approvals",
      icon: CalendarDays,
      color: "amber",
      path: `/time-off/requests?employee=${employee._id}`,
    },
    {
      title: "Time Off Allocations",
      description: "Assigned leave balance quotas",
      icon: Award,
      color: "violet",
      path: `/time-off/allocations?employee=${employee._id}`,
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "indigo":
        return {
          bg: "bg-indigo-50/70",
          border: "border-indigo-100",
          iconBg: "bg-indigo-600 text-white",
          hoverBorder: "hover:border-indigo-300",
        };
      case "emerald":
        return {
          bg: "bg-emerald-50/70",
          border: "border-emerald-100",
          iconBg: "bg-emerald-600 text-white",
          hoverBorder: "hover:border-emerald-300",
        };
      case "amber":
        return {
          bg: "bg-amber-50/70",
          border: "border-amber-100",
          iconBg: "bg-amber-600 text-white",
          hoverBorder: "hover:border-amber-300",
        };
      case "violet":
        return {
          bg: "bg-violet-50/70",
          border: "border-violet-100",
          iconBg: "bg-violet-600 text-white",
          hoverBorder: "hover:border-violet-300",
        };
      default:
        return {
          bg: "bg-slate-50",
          border: "border-slate-200",
          iconBg: "bg-slate-700 text-white",
          hoverBorder: "hover:border-slate-400",
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Related Operational Modules
        </h3>
        <span className="text-xs text-slate-400">Direct filtered links</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {links.map((item) => {
          const colors = getColorClasses(item.color);
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.path}
              className={`p-4 rounded-2xl border ${colors.bg} ${colors.border} ${colors.hoverBorder} transition-all duration-150 shadow-xs hover:shadow-md flex flex-col justify-between group bg-white`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${colors.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
