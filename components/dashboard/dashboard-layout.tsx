"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

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
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* <div className="lg:pl-[292px]"> */}
      <div>
        
           <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8">
            
            {/* Left Section */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-md border border-slate-300 dark:border-slate-600"
              >
                ☰
              </button>

              <div>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {(userName || userEmail) && (
                <div className="text-right hidden sm:block">
                  {userName && (
                    <p className="text-sm font-medium text-slate-700 dark:text-white">
                      {userName}
                    </p>
                  )}
                  {userEmail && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {userEmail}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
