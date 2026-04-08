"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineX,
  HiOutlineFilter,
  HiOutlineEye,
} from "react-icons/hi";
import { Skeleton } from "@/components/ui/loaders/skeleton";
import {
  getHRNotifications,
  markHRNotificationAsRead,
  markAllHRNotificationsAsRead,
  LeaveNotification,
} from "@/lib/client/leave";
import { ROUTES } from "@/lib/constants";
import { useRouter } from "next/navigation";

type NotificationType =
  | "LEAVE_APPLIED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_MODIFICATION_REQUESTED"
  | "LEAVE_CANCELLED"
  | "BALANCE_LOW"
  | "COMP_OFF_EARNED"
  | "COMP_OFF_EXPIRING"
  | "COMP_OFF_APPLIED"
  | "COMP_OFF_APPROVED"
  | "COMP_OFF_REJECTED";

const notificationConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  LEAVE_APPLIED: { icon: HiOutlineCalendar, color: "text-blue-600", bgColor: "bg-blue-100" },
  LEAVE_APPROVED: { icon: HiOutlineCheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  LEAVE_REJECTED: { icon: HiOutlineXCircle, color: "text-red-600", bgColor: "bg-red-100" },
  LEAVE_MODIFICATION_REQUESTED: { icon: HiOutlineClock, color: "text-amber-600", bgColor: "bg-amber-100" },
  LEAVE_CANCELLED: { icon: HiOutlineX, color: "text-slate-600", bgColor: "bg-slate-100" },
  BALANCE_LOW: { icon: HiOutlineBell, color: "text-amber-600", bgColor: "bg-amber-100" },
  COMP_OFF_EARNED: { icon: HiOutlineCheck, color: "text-purple-600", bgColor: "bg-purple-100" },
  COMP_OFF_EXPIRING: { icon: HiOutlineClock, color: "text-orange-600", bgColor: "bg-orange-100" },
  COMP_OFF_APPLIED: { icon: HiOutlineCalendar, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  COMP_OFF_APPROVED: { icon: HiOutlineCheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  COMP_OFF_REJECTED: { icon: HiOutlineXCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

const typeLabels: Record<string, string> = {
  LEAVE_APPLIED: "Leave Applied",
  LEAVE_APPROVED: "Leave Approved",
  LEAVE_REJECTED: "Leave Rejected",
  LEAVE_MODIFICATION_REQUESTED: "Modification Requested",
  LEAVE_CANCELLED: "Leave Cancelled",
  BALANCE_LOW: "Low Balance Alert",
  COMP_OFF_EARNED: "Comp-Off Earned",
  COMP_OFF_EXPIRING: "Comp-Off Expiring",
  COMP_OFF_APPLIED: "Comp-Off Requested",
  COMP_OFF_APPROVED: "Comp-Off Approved",
  COMP_OFF_REJECTED: "Comp-Off Rejected",
};

type FilterType = "all" | "unread" | NotificationType;

export default function HRNotificationsPage() {
  const [notifications, setNotifications] = useState<LeaveNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const result = await getHRNotifications(filter === "unread");
      if (result.data?.notifications) {
        setNotifications(result.data.notifications);
      }
    } catch {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const result = await markHRNotificationAsRead(id);
      if (result.data?.notification) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true);
    try {
      const result = await markAllHRNotificationsAsRead();
      if (result.data?.count) {
        toast.success(`${result.data.count} notifications marked as read`);
        fetchNotifications();
      }
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  function handleViewNotification(notification: LeaveNotification) {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.relatedType === "LeaveApplication" && notification.relatedId) {
      router.push(`${ROUTES.DASHBOARD.HR.LEAVE.LIST}?highlight=${notification.relatedId}`);
    }
  }

  function formatTimeAgo(date: Date | string) {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notifDate.toLocaleDateString();
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalUnread = filter === "unread" ? notifications.length : notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all" || filter === "unread") return true;
    return n.type === filter;
  });

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "LEAVE_APPLIED", label: "Leave Applied" },
    { value: "LEAVE_APPROVED", label: "Leave Approved" },
    { value: "LEAVE_REJECTED", label: "Leave Rejected" },
    { value: "LEAVE_CANCELLED", label: "Leave Cancelled" },
    { value: "COMP_OFF_EARNED", label: "Comp-Off" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineBell className="text-xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-13">
            Stay updated with employee leave requests and alerts
          </p>
        </div>
        {totalUnread > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <HiOutlineCheck className="text-lg" />
            Mark All as Read ({totalUnread})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{notifications.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{totalUnread}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Leave Requests</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {notifications.filter((n) => n.type.includes("LEAVE")).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Comp-Off</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {notifications.filter((n) => n.type.includes("COMP_OFF")).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === option.value
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <HiOutlineBell className="text-2xl text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No notifications</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {filter === "unread" ? "All caught up!" : "You're all set for now"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredNotifications.map((notification) => {
              const config = notificationConfig[notification.type] || notificationConfig.LEAVE_APPLIED;
              const Icon = config.icon;
              const isClickable = notification.relatedType === "LeaveApplication";

              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    !notification.isRead ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl ${config.bgColor} dark:bg-opacity-20 flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`text-xl ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                              {typeLabels[notification.type] || notification.type}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isClickable && (
                            <button
                              onClick={() => handleViewNotification(notification)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                              title="View Details"
                            >
                              <HiOutlineEye className="text-lg" />
                            </button>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                              title="Mark as Read"
                            >
                              <HiOutlineCheck className="text-lg" />
                            </button>
                          )}
                        </div>
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
  );
}
