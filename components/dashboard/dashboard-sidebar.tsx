"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdAccountTree, MdBusiness, MdDashboard, MdPayments, MdPeople, MdSettings } from "react-icons/md";

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard/hr", icon: MdDashboard, available: true },
  { label: "Company Setup", href: "/dashboard/hr/company-setup", icon: MdBusiness, available: true },
  { label: "Employees", href: "/dashboard/hr/employees", icon: MdPeople, available: true },
  { label: "Organization", href: "", icon: MdAccountTree, available: false },
  { label: "Payroll", href: "", icon: MdPayments, available: false },
  { label: "Settings", href: "", icon: MdSettings, available: false },
] as const;

function NavItem({
  label,
  href,
  icon,
  available,
  active,
  onClose,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  active: boolean;
  onClose: () => void;
}) {
  const Icon = icon;
  const content = (
    <>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active
          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-200"
          : "bg-slate-100 text-slate-500"
          }`}
      >
        <Icon className="text-lg" />
      </span>
      <span className="flex-1">
        <span className={`block text-sm font-medium ${active ? "text-slate-950" : "text-slate-700"}`}>{label}</span>
        <span className="block text-xs text-slate-400">{available ? "Open section" : "Coming soon"}</span>
      </span>
    </>
  );

  if (!available) {
    return (
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${active ? "bg-indigo-50 shadow-sm ring-1 ring-indigo-100" : "hover:bg-slate-50"
        }`}
    >
      {content}
    </Link>
  );
}

export function DashboardSidebar({ mobileOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition lg:hidden ${mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">WorkNest</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">HR Command</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-5 text-white shadow-lg shadow-indigo-200">
            <p className="text-xs uppercase tracking-[0.28em] text-blue-100">Workspace</p>
            <p className="mt-3 text-lg font-semibold">Premium HR operations interface</p>
            <p className="mt-2 text-sm leading-6 text-blue-50/90">Built to keep company setup and day-to-day workflows clean, fast, and scalable.</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const active = item.available && (pathname === item.href || pathname.startsWith(`${item.href}/`));

              return (
                <NavItem
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  available={item.available}
                  active={active}
                  onClose={onClose}
                />
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 px-5 py-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Need help?</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">Keep building your workspace. New dashboard modules can plug into this layout without changing your current routes.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
