import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { selectCurrentUser, logout } from "../../features/auth/authSlice";
import { apiFetch } from "../../lib/apiClient";
import { addNotification } from "../../features/notifications/notificationSlice";
import { LogOut, ChevronDown, User, UserCheck, Mail, Shield } from "lucide-react";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      dispatch(
        addNotification({
          type: "info",
          message: "You have been logged out.",
        })
      );
    } catch (e) {
      console.error("Logout request error:", e);
    } finally {
      dispatch(logout());
      window.location.href = "/login";
    }
  };

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const initials = (user?.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = userRoles.includes("Admin");
  const isEmployee = userRoles.includes("Employee");

  return (
    <div className="relative inline-block text-left shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 pl-1.5 sm:pl-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer select-none focus:outline-hidden"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
            {user?.fullName || "User"}
          </span>
          <span className="text-[10px] text-indigo-600 font-medium truncate max-w-[130px]">
            {userRoles[0] || "Member"}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl shadow-slate-900/10 border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Profile Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {userRoles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1 border-b border-slate-100">
            {isEmployee && (
              <Link
                to="/me"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>My Profile</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>User Management</span>
              </Link>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-1 px-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

