"use client";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import { LOGO_URL } from "@/lib/logo";

interface DashboardShellProps {
  children: ReactNode;
  sidebarRole: string;
  sidebarUserName: string;
}

export default function DashboardShell({ children, sidebarRole, sidebarUserName }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — Desktop */}
      <div className="hidden md:block">
        <DashboardSidebar role={sidebarRole} userName={sidebarUserName} />
      </div>

      {/* Sidebar — Mobile (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <DashboardSidebar role={sidebarRole} userName={sidebarUserName} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <img src={LOGO_URL} alt="ReservaTuCancha" className="h-6 w-6 object-contain" />
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}