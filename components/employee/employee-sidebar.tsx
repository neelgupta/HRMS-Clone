"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdDashboard,
  MdPerson,
  MdInbox,
  MdPeople,
  MdAccessTime,
  MdEventNote,
  MdBeachAccess,
  MdMoreTime,
  MdHelp,
} from "react-icons/md";
import { useTheme } from "@/contexts/theme-context";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/employee", icon: MdDashboard },
  { label: "My Profile", href: "/dashboard/employee/profile", icon: MdPerson },
  { label: "Inbox", href: "/dashboard/employee/inbox", icon: MdInbox },
  { label: "Employee", href: "/dashboard/employee/employees", icon: MdPeople },
  { label: "Attendance", href: "/dashboard/employee/attendance", icon: MdAccessTime },
  { label: "Leave", href: "/dashboard/employee/leave", icon: MdEventNote },
  { label: "Overtime", href: "/dashboard/employee/overtime", icon: MdMoreTime },
  { label: "My Holidays", href: "/dashboard/employee/holidays", icon: MdBeachAccess },
  { label: "Help Desk", href: "/dashboard/employee/help", icon: MdHelp },
];

function NavItemComponent({
  item,
  isActive,
  onClose,
}: {
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
}) {
  const Icon = item.icon;
  const isRoot = item.href === "/dashboard/employee";
  const active = isRoot ? isActive : isActive;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
        active 
          ? "bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 dark:from-indigo-400/20 dark:to-indigo-400/10 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800/50" 
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
          active
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        <Icon className="text-lg" />
      </span>
      <span className="flex-1">
        <span className={`block text-sm font-medium transition-colors ${active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>
          {item.label}
        </span>
        <span className="block text-xs text-slate-400 dark:text-slate-500">Open section</span>
      </span>
    </Link>
  );
}

type EmployeeSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  userName?: string;
  activeItem?: string;
};

export function EmployeeSidebar({ mobileOpen, onClose, userName = "Employee", activeItem }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const isActive = (itemHref: string) => {
    if (itemHref === "/dashboard/employee") {
      return pathname === itemHref;
    }
    return pathname.startsWith(itemHref);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          mobileOpen 
            ? "pointer-events-auto opacity-100 bg-slate-950/50 dark:bg-slate-950/70" 
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r transition-all duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          theme === "dark" 
            ? "bg-slate-900 border-slate-800" 
            : "bg-white border-slate-200"
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-5 ${
          theme === "dark" ? "border-slate-800" : "border-slate-200"
        }`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              WorkNest
            </p>
            <h2 className={`mt-2 text-xl font-semibold ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
              Employee Portal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden ${
              theme === "dark" ? "border-slate-700 text-slate-400 bg-slate-800" : "border-slate-200 text-slate-600 bg-white"
            }`}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-200">Welcome</p>
            <p className="mt-3 text-lg font-semibold">{userName}</p>
            <p className="mt-2 text-sm leading-6 text-indigo-100/90">
              Your self-service portal for attendance and profile.
            </p>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <NavItemComponent
                key={item.label}
                item={item}
                isActive={isActive(item.href)}
                onClose={onClose}
              />
            ))}
          </nav>
        </div>

        <div className={`border-t px-5 py-5 ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
          <div className={`rounded-2xl p-4 ${
            theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"
          }`}>
            <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-200" : "text-slate-900"}`}>
              Need help?
            </p>
            <p className={`mt-1 text-xs leading-6 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              Contact HR for any queries about your account.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function useEmployeeLogout() {
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };
}
