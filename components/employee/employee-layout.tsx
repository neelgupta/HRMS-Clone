"use client";

import { useState, useEffect, Suspense, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmployeeSidebar, EmployeeTopbar, useEmployeeLogout } from "@/components/employee";
import { PageLoader } from "@/components/ui/loader";
import { useTheme } from "@/contexts/theme-context";
import { ROUTES } from "@/lib/constants";

type EmployeeLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

type EmployeeProfile = {
  name: string;
  email: string;
  role: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string | null;
    department: string | null;
    photoUrl: string | null;
  } | null;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// Cache for API responses
let profileCache: { data: EmployeeProfile | null; timestamp: number } | null = null;
let notificationsCache: { data: { count: number; notifications: NotificationItem[] }; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

async function fetchWithCache<T>(
  url: string,
  cache: { data: T | null; timestamp: number } | null,
  credentials: RequestCredentials = "include"
): Promise<T | null> {
  const now = Date.now();
  
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }
  
  try {
    const res = await fetch(url, { credentials });
    if (res.ok) {
      const data = await res.json();
      return data as T;
    }
  } catch (e) {
    console.error("Fetch error:", e);
  }
  return null;
}

export function EmployeeLayout({ children, title, subtitle }: EmployeeLayoutProps) {
  const router = useRouter();
  const { mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const handleLogout = useEmployeeLogout();

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      try {
        const res = await fetch("/api/employees/dashboard", { credentials: "include" });
        
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          
          const notifications = data.notifications || [];
          setNotificationCount(data.unreadCount || 0);
          setRecentNotifications(notifications.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Poll for notifications every 30 seconds (fast count-only endpoint)
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/leave/notifications?count=true", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.count || data.unreadCount || 0);
        }
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/leave/notifications/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      setNotificationCount(prev => Math.max(0, prev - 1));
      setRecentNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const unreadNotifications = recentNotifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/leave/notifications/${n.id}`, {
            method: "PUT",
            credentials: "include",
          })
        )
      );
      setNotificationCount(0);
      setRecentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  }, [recentNotifications]);

  const fullName = profile?.employee
    ? `${profile.employee.firstName} ${profile.employee.lastName}`
    : profile?.name || "Employee";

  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : "E";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <EmployeeSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        userName={fullName}
      />

      <div className="lg:pl-[292px]">
        <EmployeeTopbar
          userName={fullName}
          userInitials={initials}
          designation={profile?.employee?.designation || "Employee"}
          onLogout={handleLogout}
          notificationCount={notificationCount}
          notifications={recentNotifications}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsAsRead}
          notificationHref={ROUTES.DASHBOARD.EMPLOYEE.NOTIFICATIONS}
        />

        <main className="px-6 py-6">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
            </div>
          )}
          <Suspense fallback={<PageLoader />}>
            {loading ? <PageLoader /> : children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
