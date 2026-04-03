"use client";

import { useState, useEffect, Suspense, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmployeeSidebar, EmployeeTopbar, useEmployeeLogout } from "@/components/employee";
import { PageLoader } from "@/components/ui/loader";

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

export function EmployeeLayout({ children, title, subtitle }: EmployeeLayoutProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const handleLogout = useEmployeeLogout();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/employees/me");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/leave/notifications?unread=true", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const notifications = data.notifications || [];
          setNotificationCount(notifications.length);
          setRecentNotifications(notifications.slice(0, 5));
        }
      } catch {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/leave/notifications/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        setNotificationCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      console.error("Failed to mark notification as read");
    }
  };

  const fullName = profile?.employee
    ? `${profile.employee.firstName} ${profile.employee.lastName}`
    : profile?.name || "Employee";

  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : "E";

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
          notificationHref="/dashboard/employee/notifications"
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
