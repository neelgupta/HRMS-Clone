"use client";

import { useEffect, useMemo, useState } from "react";
import { MdCalendarMonth } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { Spinner } from "@/components/ui/loaders/spinner";
import { getHolidays, type Holiday } from "@/lib/client/leave";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function formatMonthDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function HolidaysContent() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { branchId?: string | null; employee?: { branchId?: string | null } | null };
        const id = data.employee?.branchId || data.branchId || undefined;
        if (mounted) setBranchId(id ?? undefined);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getHolidays(year, branchId);
        if (!mounted) return;
        if (res.error || res.message) {
          setError(res.error || res.message || "Failed to load holidays.");
          setHolidays([]);
          return;
        }
        setHolidays(res.data?.holidays || []);
      } catch {
        if (mounted) {
          setError("Failed to load holidays.");
          setHolidays([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [year, branchId]);

  const today = useMemo(() => startOfToday(), []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let thisMonthCount = 0;
    let upcomingCount = 0;

    for (const h of holidays) {
      const date = parseDate(h.date);
      if (!date) continue;
      if (date.getFullYear() === thisYear && date.getMonth() === thisMonth) thisMonthCount++;
      if (date >= today) upcomingCount++;
    }

    return {
      total: holidays.length,
      thisMonth: thisMonthCount,
      upcoming: upcomingCount,
    };
  }, [holidays, today]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing holidays for <span className="font-semibold text-slate-700 dark:text-slate-200">{year}</span>
          {branchId ? (
            <span className="ml-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Branch-specific
            </span>
          ) : (
            <span className="ml-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              All branches
            </span>
          )}
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
        >
          {[year - 1, year, year + 1, year + 2].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Holidays</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">This Month</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.thisMonth}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.upcoming}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Holiday Calendar {year}</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="py-12">
              <Spinner className="mx-auto text-indigo-600" label="Loading" />
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{error}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try again in a moment.</p>
            </div>
          ) : holidays.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No holidays found for {year}.</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ask HR to add holidays for your company calendar.</p>
            </div>
          ) : (
            holidays.map((holiday) => {
              const holidayDate = parseDate(holiday.date);
              if (!holidayDate) return null;
              const isUpcoming = holidayDate >= today;
            return (
              <div
                key={holiday.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isUpcoming ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                }`}>
                  <MdCalendarMonth className="text-xl" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{holiday.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDay(holidayDate)}
                    {holiday.isOptional ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        Optional
                      </span>
                    ) : null}
                    {holiday.branch?.name ? (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        {holiday.branch.name}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${isUpcoming ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {formatMonthDay(holidayDate)}
                  </p>
                  {isUpcoming && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">Upcoming</span>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default function HolidaysPage() {
  return (
    <EmployeeLayout title="My Holidays" subtitle="View company holidays and leave calendar">
      <HolidaysContent />
    </EmployeeLayout>
  );
}
