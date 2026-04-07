"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { EmployeeTopbar } from "@/components/employee/employee-topbar";
import { PageLoader } from "@/components/ui/loader";
import { getHRNotifications } from "@/lib/client/leave";
import { useTheme } from "@/contexts/theme-context";

type HRLayoutProps = {
  children: ReactNode;
};

type CurrentUser = {
  name: string;
  email: string;
  role: string;
};

export default function HRDashboardLayout({ children }: HRLayoutProps) {
  const router = useRouter();
  const { mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        setUser(data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await getHRNotifications(true);
        if (result.data?.notifications) {
          setNotificationCount(result.data.notifications.length);
        }
      } catch {
        // Ignore notification fetch errors
      }
    };

    if (user) {
      void fetchNotifications();
      const interval = setInterval(() => {
        void fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-[292px]">
        <EmployeeTopbar
          userName={user.name}
          userInitials={initials}
          designation="HR Admin"
          onLogout={handleLogout}
          notificationCount={notificationCount}
          onMarkAllAsRead={async () => {
            const result = await getHRNotifications(true);
            if (result.data?.notifications) {
              for (const n of result.data.notifications) {
                await fetch(`/api/leave/notifications/hr`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: n.id }),
                  credentials: "include",
                });
              }
              setNotificationCount(0);
            }
          }}
          notificationHref="/dashboard/hr/notifications"
          profileHref="/dashboard/hr/profile"
        />

        <main className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}