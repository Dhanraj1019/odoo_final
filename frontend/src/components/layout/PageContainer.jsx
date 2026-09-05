import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function PageContainer({
  title,
  description,
  breadcrumbs = [],
  actions = null,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="space-y-1">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Link to="/" className="hover:text-slate-600 transition-colors">
                Home
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label || idx}>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  {crumb.path ? (
                    <Link
                      to={crumb.path}
                      className="hover:text-slate-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-600 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-slate-500 font-normal">{description}</p>
          )}
        </div>

        {/* Action Button Slots */}
        {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
      </div>

      {/* Main Page Content */}
      <div>{children}</div>
    </div>
  );
}
