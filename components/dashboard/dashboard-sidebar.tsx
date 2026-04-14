"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MdAccountTree, MdBusiness, MdDashboard, MdPayments, MdPeople, MdSettings, MdAccessTime, MdSchedule, MdPerson, MdAssessment, MdEventNote, MdCalendarMonth, MdPolicy, MdNotifications, MdHelpOutline } from "react-icons/md";
import { useTheme } from "@/contexts/theme-context";

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  forRole?: string[];
};

const hrNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/hr", icon: MdDashboard, available: true },
  { label: "Company Setup", href: "/dashboard/hr/company-setup", icon: MdBusiness, available: true },
  { label: "Employees", href: "/dashboard/hr/employees", icon: MdPeople, available: true },
  { label: "Attendance", href: "/dashboard/hr/attendance", icon: MdAccessTime, available: true },
  { label: "Attendance Reports", href: "/dashboard/hr/attendance/reports", icon: MdAssessment, available: true },
  { label: "Shifts", href: "/dashboard/hr/shifts", icon: MdSchedule, available: true },
  { label: "Leave Management", href: "/dashboard/hr/leave", icon: MdEventNote, available: true },
  { label: "Leave Types", href: "/dashboard/hr/leave-types", icon: MdPolicy, available: true },
  { label: "Leave Policy", href: "/dashboard/hr/leave-policy", icon: MdPolicy, available: true },
  { label: "Holidays", href: "/dashboard/hr/holidays", icon: MdCalendarMonth, available: true },
  { label: "Ticket Management", href: "/dashboard/hr/tickets", icon: MdHelpOutline, available: true },
  { label: "Notifications", href: "/dashboard/hr/notifications", icon: MdNotifications, available: true },
  { label: "Organization", href: "/dashboard/hr/organization", icon: MdAccountTree, available: true },
  { label: "Payroll", href: "/dashboard/hr/payroll", icon: MdPayments, available: true },
  { label: "Settings", href: "/dashboard/hr/settings", icon: MdSettings, available: true },
];

const employeeNavItems: NavItem[] = [
  { label: "My Dashboard", href: "/dashboard/employee", icon: MdDashboard, available: true },
  { label: "My Attendance", href: "/dashboard/employee", icon: MdAccessTime, available: true },
  { label: "My Profile", href: "/dashboard/employee", icon: MdPerson, available: true },
];

function NavItem({
  label,
  href,
  icon,
  available,
  active,
  onClose,
  isDark,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  active: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  const Icon = icon;
  const content = (
    <>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          active
            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900"
            : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="text-lg" />
      </span>
      <span className="flex-1">
        <span className={`block text-sm font-medium ${active ? (isDark ? "text-white" : "text-slate-950") : (isDark ? "text-slate-200" : "text-slate-700")}`}>
          {label}
        </span>
        <span className={`block text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{available ? "Open section" : "Coming soon"}</span>
      </span>
    </>
  );

  if (!available) {
    return (
      <button type="button" className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}>
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
        active 
          ? isDark ? "bg-indigo-900/30 shadow-sm ring-1 ring-indigo-800/50" : "bg-indigo-50 shadow-sm ring-1 ring-indigo-100" 
          : isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
      }`}
    >
      {content}
    </Link>
  );
}

export function DashboardSidebar({ mobileOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { theme, mounted } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const isDark = mounted && theme === "dark";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
          setUserName(data.name || data.email || "User");
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, []);

  const isEmployee = userRole === "EMPLOYEE";
  const navItems = isEmployee ? employeeNavItems : hrNavItems;
  const title = isEmployee ? "Employee Portal" : "HR Command";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 dark:bg-slate-950/70 backdrop-blur-sm transition lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDark
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200"
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-5 ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>WorkNest</p>
            <h2 className={`mt-2 text-xl font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-2xl border px-3 py-2 text-sm font-medium transition lg:hidden ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className={`h-32 rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-14 rounded-2xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                <p className="text-xs uppercase tracking-[0.28em] text-blue-100">
                  {isEmployee ? "Employee" : "Workspace"}
                </p>
                <p className="mt-3 text-lg font-semibold">{userName}</p>
                <p className="mt-2 text-sm leading-6 text-blue-50/90">
                  {isEmployee
                    ? "Your self-service portal for attendance and profile."
                    : "Premium HR operations interface"}
                </p>
              </div>

              <nav className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const active =
                    item.available && (pathname === item.href || pathname.startsWith(`${item.href}/`));

                  return (
                    <NavItem
                      key={item.label}
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                      available={item.available}
                      active={active}
                      onClose={onClose}
                      isDark={isDark}
                    />
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <div className={`border-t px-5 py-5 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
            <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-900"}`}>Need help?</p>
            <p className={`mt-1 text-xs leading-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {isEmployee
                ? "Contact HR for any queries about your account."
                : "Keep building your workspace. New dashboard modules can plug into this layout."}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
