"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItemProps = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  isDark: boolean;
  onClick?: () => void;
  available?: boolean;
};

export const SidebarNavItem = memo(function SidebarNavItem({
  label,
  href,
  icon: Icon,
  active,
  isDark,
  onClick,
  available = true,
}: NavItemProps) {
  const iconBg = active
    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30"
    : isDark
    ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
    : "bg-slate-100 text-slate-500 hover:bg-slate-200";

  const textColor = active
    ? isDark
      ? "text-indigo-300"
      : "text-indigo-700"
    : isDark
    ? "text-slate-300"
    : "text-slate-700";

  const itemBg = active
    ? isDark
      ? "bg-gradient-to-r from-indigo-400/20 to-indigo-400/10 shadow-sm ring-1 ring-indigo-800/50"
      : "bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 shadow-sm ring-1 ring-indigo-200"
    : isDark
    ? "hover:bg-slate-800/50"
    : "hover:bg-slate-100";

  const content = (
    <>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${iconBg}`}>
        <Icon className="text-lg" />
      </span>
      <span className="flex-1">
        <span className={`block text-sm font-medium transition-colors ${textColor}`}>
          {label}
        </span>
        <span className={`block text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {available ? "Open section" : "Coming soon"}
        </span>
      </span>
    </>
  );

  if (!available) {
    return (
      <button
        type="button"
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${itemBg}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${itemBg}`}
    >
      {content}
    </Link>
  );
});

type NavItemConfig = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  forRole?: string[];
};

type SidebarNavProps = {
  items: NavItemConfig[];
  isDark: boolean;
  onClose: () => void;
  currentRole?: string;
};

export function SidebarNav({ items, isDark, onClose, currentRole }: SidebarNavProps) {
  const pathname = usePathname();

  const filteredItems = items.filter((item) => {
    if (!item.forRole) return true;
    return item.forRole.includes(currentRole || "");
  });

  return (
    <nav className="mt-6 space-y-1">
      {filteredItems.map((item) => {
        const isActive =
          item.available &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        return (
          <SidebarNavItem
            key={item.label}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={isActive}
            isDark={isDark}
            onClick={onClose}
            available={item.available}
          />
        );
      })}
    </nav>
  );
}
