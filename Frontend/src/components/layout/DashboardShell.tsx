"use client";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  sidebarRole: string;
  sidebarUserName: string;
}

export default function DashboardShell({ children, sidebarRole, sidebarUserName }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar role={sidebarRole} userName={sidebarUserName} />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}