"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

type DashboardLayoutProps = {
  title: string;
  subtitle?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  children: ReactNode;
};

export function DashboardLayout({
  title,
  subtitle,
  userName,
  userEmail,
  onLogout,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* <div className="lg:pl-[292px]"> */}
       <div>
        <DashboardTopbar
          title={title}
          subtitle={subtitle}
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={onLogout}
        />

        <main className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
