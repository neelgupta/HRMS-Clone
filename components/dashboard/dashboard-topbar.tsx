"use client";

import { MdLogout, MdMenu, MdNotificationsNone, MdOutlineAccountCircle } from "react-icons/md";

type DashboardTopbarProps = {
  title: string;
  subtitle?: string;
  userName?: string;
  userEmail?: string;
  onMenuClick: () => void;
  onLogout?: () => void;
};

export function DashboardTopbar({
  title,
  subtitle,
  userName,
  userEmail,
  onMenuClick,
  onLogout,
}: DashboardTopbarProps) {
  const initials = userName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            <MdMenu className="text-xl" />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            <MdNotificationsNone className="text-xl" />
            <span className="absolute right-3 top-3 flex h-2.5 w-2.5 rounded-full bg-indigo-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/60" />
            </span>
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 text-sm font-semibold text-white">
              {initials || <MdOutlineAccountCircle className="text-2xl" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{userName || "HR Admin"}</p>
              <p className="truncate text-xs text-slate-500">{userEmail || "Workspace access"}</p>
            </div>
          </div>

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <MdLogout className="text-base" />
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
