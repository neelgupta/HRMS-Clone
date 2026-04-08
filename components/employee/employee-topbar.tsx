"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MdSearch, 
  MdKeyboardArrowDown, 
  MdPerson, 
  MdLogout,
} from "react-icons/md";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/ui/notification-bell";
import { ROUTES } from "@/lib/constants";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type EmployeeTopbarProps = {
  userName: string;
  userInitials: string;
  designation?: string;
  onLogout: () => Promise<void>;
  notificationCount?: number;
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onNotificationClick?: () => void;
  notificationHref?: string;
  profileHref?: string;
};

export function EmployeeTopbar({ 
  userName, 
  userInitials, 
  designation = "Employee", 
  onLogout,
  notificationCount = 0,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  notificationHref,
  profileHref = ROUTES.DASHBOARD.EMPLOYEE.PROFILE
}: EmployeeTopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNotificationClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else if (notificationHref) {
      router.push(notificationHref);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              <input
                type="text"
                placeholder="Search for Menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-6">
            <ThemeToggle />
            
            <NotificationBell
              notificationCount={notificationCount}
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              href={notificationHref}
            />

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl px-3 py-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {userInitials}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{designation}</p>
                </div>
                <MdKeyboardArrowDown className="text-slate-400 dark:text-slate-500" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <button
                    onClick={() => router.push(profileHref)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <MdPerson className="text-slate-500 dark:text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">My Profile</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-red-500"
                  >
                    <MdLogout className="dark:text-red-400" />
                    <span className="text-sm dark:text-red-400">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}
