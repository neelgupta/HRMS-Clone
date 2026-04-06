"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import {
  MdNotifications,
  MdNotificationsNone,
  MdEventNote,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdCheck,
  MdWarning,
} from "react-icons/md";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationBellProps = {
  notificationCount?: number;
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  href?: string;
  className?: string;
};

const notificationIcons: Record<string, { icon: typeof MdNotifications; color: string; bg: string }> = {
  LEAVE_APPLIED: { icon: MdEventNote, color: "text-blue-500", bg: "bg-blue-100" },
  LEAVE_APPROVED: { icon: MdCheckCircle, color: "text-green-500", bg: "bg-green-100" },
  LEAVE_REJECTED: { icon: MdCancel, color: "text-red-500", bg: "bg-red-100" },
  LEAVE_MODIFICATION_REQUESTED: { icon: MdWarning, color: "text-amber-500", bg: "bg-amber-100" },
  LEAVE_CANCELLED: { icon: MdCancel, color: "text-slate-500", bg: "bg-slate-100" },
  BALANCE_LOW: { icon: MdWarning, color: "text-amber-500", bg: "bg-amber-100" },
  COMP_OFF_EARNED: { icon: MdCheck, color: "text-purple-500", bg: "bg-purple-100" },
  COMP_OFF_EXPIRING: { icon: MdAccessTime, color: "text-orange-500", bg: "bg-orange-100" },
  COMP_OFF_APPROVED: { icon: MdCheckCircle, color: "text-green-500", bg: "bg-green-100" },
  COMP_OFF_REJECTED: { icon: MdCancel, color: "text-red-500", bg: "bg-red-100" },
  COMP_OFF_APPLIED: { icon: MdEventNote, color: "text-blue-500", bg: "bg-blue-100" },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const NotificationBell = memo(function NotificationBell({
  notificationCount = 0,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  href,
  className = "",
}: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = useCallback(() => {
    if (href) {
      router.push(href);
    }
    setIsOpen(false);
  }, [href, router]);

  const handleMarkAsRead = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      await onMarkAsRead(id);
    }
  }, [onMarkAsRead]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
      >
        {notificationCount > 0 ? (
          <MdNotifications className="text-xl text-slate-500 dark:text-slate-400" />
        ) : (
          <MdNotificationsNone className="text-xl text-slate-500 dark:text-slate-400" />
        )}
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5 animate-pulse">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-50 dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-2">
              <MdNotifications className="text-indigo-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
              {notificationCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                  {notificationCount} new
                </span>
              )}
            </div>
            {notificationCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && notificationCount === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <MdNotificationsNone className="text-2xl text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">No new notifications</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                <p>{notificationCount} unread notification{notificationCount !== 1 ? "s" : ""}</p>
                {href && (
                  <button
                    onClick={handleNotificationClick}
                    className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Click to view all
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.map((notification) => {
                  const iconConfig = notificationIcons[notification.type] || notificationIcons.LEAVE_APPLIED;
                  const Icon = iconConfig.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`relative p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                      }`}
                      onClick={() => {
                        if (!notification.isRead && onMarkAsRead) {
                          onMarkAsRead(notification.id);
                        }
                        handleNotificationClick();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${iconConfig.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`text-lg ${iconConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && onMarkAsRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 0 && href && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={handleNotificationClick}
                className="w-full text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
});
