"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  MdNotifications, 
  MdCheckCircle, 
  MdCancel, 
  MdAccessTime, 
  MdEventNote, 
  MdCheck,
  MdWarning,
  MdDoneAll,
  MdFilterList
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { Skeleton } from "@/components/ui/loaders/skeleton";

type NotificationType = 
  | "LEAVE_APPLIED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_MODIFICATION_REQUESTED"
  | "LEAVE_CANCELLED"
  | "BALANCE_LOW"
  | "COMP_OFF_EARNED"
  | "COMP_OFF_EXPIRING"
  | "COMP_OFF_APPROVED"
  | "COMP_OFF_REJECTED"
  | "COMP_OFF_APPLIED";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  relatedType: string | null;
  relatedId: string | null;
}

const notificationConfig: Record<string, { 
  icon: any; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  LEAVE_APPLIED: { icon: MdEventNote, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", label: "Leave Applied" },
  LEAVE_APPROVED: { icon: MdCheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", label: "Leave Approved" },
  LEAVE_REJECTED: { icon: MdCancel, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Leave Rejected" },
  LEAVE_MODIFICATION_REQUESTED: { icon: MdWarning, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Modification Requested" },
  LEAVE_CANCELLED: { icon: MdCancel, color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-800", label: "Leave Cancelled" },
  BALANCE_LOW: { icon: MdWarning, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Low Balance Alert" },
  COMP_OFF_EARNED: { icon: MdCheck, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", label: "Comp-Off Earned" },
  COMP_OFF_EXPIRING: { icon: MdAccessTime, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", label: "Comp-Off Expiring" },
  COMP_OFF_APPROVED: { icon: MdCheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", label: "Comp-Off Approved" },
  COMP_OFF_REJECTED: { icon: MdCancel, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Comp-Off Rejected" },
  COMP_OFF_APPLIED: { icon: MdEventNote, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", label: "Comp-Off Applied" },
};

type FilterType = "all" | "unread" | NotificationType;

function NotificationIcon({ type }: { type: string }) {
  const config = notificationConfig[type] || notificationConfig.LEAVE_APPLIED;
  const Icon = config.icon;
  return (
    <div className={`w-12 h-12 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
      <Icon className={`text-xl ${config.color}`} />
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const url = filter === "unread" 
        ? "/api/leave/notifications?unread=true" 
        : "/api/leave/notifications";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/leave/notifications/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
      }
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/leave/notifications/${n.id}`, {
            method: "PUT",
            credentials: "include",
          })
        )
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filterTabs: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "LEAVE_APPROVED", label: "Approved" },
    { key: "LEAVE_REJECTED", label: "Rejected" },
    { key: "COMP_OFF_APPROVED", label: "Comp-Off" },
  ];

  return (
    <EmployeeLayout title="My Notifications" subtitle="Stay updated with your leave and comp-off requests">
      <div className="max-w-4xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{notifications.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{unreadCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Leave Related</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {notifications.filter((n) => n.type.startsWith("LEAVE")).length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Comp-Off</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {notifications.filter((n) => n.type.startsWith("COMP_OFF")).length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <MdFilterList className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <MdDoneAll className="text-lg" />
                {markingAll ? "Marking..." : "Mark all as read"}
              </button>
            )}
          </div>
          <div className="flex overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  filter === tab.key
                    ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
                    : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <MdNotifications className="text-3xl text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {filter === "unread"
                  ? "You're all caught up! Check back later for new notifications."
                  : "When you receive notifications about your leave requests or comp-off, they'll appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {notifications.map((notification) => {
                const config = notificationConfig[notification.type] || notificationConfig.LEAVE_APPLIED;
                return (
                  <div
                    key={notification.id}
                    className={`p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      !notification.isRead ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MdAccessTime className="text-sm" />
                            {formatDate(notification.createdAt)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            notification.isRead 
                              ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                          }`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
