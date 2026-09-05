import React from "react";
import { Link } from "react-router-dom";
import TopNav from "./TopNav";
import UserMenu from "./UserMenu";
import { Menu } from "lucide-react";

export default function AppHeader({ onOpenMobileMenu }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Hamburger (mobile) + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
                PeoplePay<span className="text-indigo-600">360</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                HR & Payroll Suite
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Top Navigation */}
        <div className="hidden lg:flex items-center flex-1 justify-center max-w-3xl">
          <TopNav />
        </div>

        {/* Right: User Menu Widget */}
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
