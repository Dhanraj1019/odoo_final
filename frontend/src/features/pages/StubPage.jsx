import React from "react";
import { FolderOpen } from "lucide-react";

export default function StubPage({ title, module, description }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {description || `Module: ${module || "PeoplePay360"}`}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">{title} Module</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Foundation initialized. This component will be fully implemented in the upcoming phase.
        </p>
      </div>
    </div>
  );
}
