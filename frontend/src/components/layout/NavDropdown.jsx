import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export default function NavDropdown({
  label,
  icon: Icon,
  items = [],
  basePath = "",
  align = "left",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Check if any child item or the base path is active
  const isActive =
    (basePath && location.pathname.startsWith(basePath)) ||
    items.some(
      (item) =>
        location.pathname === item.path ||
        (item.path !== "/" && location.pathname.startsWith(`${item.path}/`))
    );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative inline-block text-left shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none whitespace-nowrap ${
          isActive
            ? "bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
        }`}
        aria-expanded={isOpen}
      >
        {Icon && (
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? "text-indigo-600" : "text-slate-400"
            }`}
          />
        )}
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : "text-slate-400"
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1.5 w-60 rounded-xl bg-white shadow-xl shadow-slate-900/10 border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            {label} Modules
          </div>
          {items.map((item) => {
            const ItemIcon = item.icon;
            const isItemActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isItemActive
                    ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={`w-4 h-4 shrink-0 ${
                      isItemActive ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="leading-tight truncate">{item.label}</div>
                  {item.description && (
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

