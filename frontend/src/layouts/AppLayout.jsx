import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import MobileNavDrawer from "../components/layout/MobileNavDrawer";
import NotificationToast from "../components/common/NotificationToast";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Application Header */}
      <AppHeader onOpenMobileMenu={() => setMobileNavOpen(true)} />

      {/* Responsive Mobile Drawer */}
      <MobileNavDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        PeoplePay360 • Enterprise Payroll & HRMS Management System
      </footer>

      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
}
