"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Spinner } from "@/components/ui/loaders/spinner";
import { fetchPayrollRuns } from "@/lib/client/payroll";
import { showError } from "@/lib/toast";

function currentYear() {
  return new Date().getFullYear();
}

function monthLabel(month: number) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return labels[month - 1] || String(month);
}

function toMonthString(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("generated") || normalized.includes("complete") || normalized.includes("success")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200";
  }
  if (normalized.includes("pending") || normalized.includes("processing") || normalized.includes("running")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200";
  }
  if (normalized.includes("failed") || normalized.includes("error")) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-700/30 dark:text-slate-200";
}

export default function PayrollHomePage() {
  const router = useRouter();
  const [year] = useState(currentYear());
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<Array<{ id: string; year: number; month: number; status: string; updatedAt: string }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const result = await fetchPayrollRuns(year);
        if (result.error) {
          showError(result.error);
          return;
        }
        if (mounted && result.data) {
          setRuns(result.data.runs.map((r) => ({ id: r.id, year: r.year, month: r.month, status: r.status, updatedAt: r.updatedAt })));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [year]);

  const sortedRuns = useMemo(() => {
    return [...runs].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [runs]);

  return (
    <DashboardLayout title="Payroll" subtitle={`Payroll runs (${year})`}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/hr/payroll/generate")}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl dark:shadow-indigo-900/50"
          >
            Generate Payroll
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Payroll List</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Click a payroll month to view details.</p>
          </div>

          {loading ? (
            <div className="py-12">
              <Spinner className="mx-auto text-indigo-600" label="Loading" />
            </div>
          ) : sortedRuns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/20">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No payroll generated yet.</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Generate payroll for a month to see it here.</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/hr/payroll/generate")}
                className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Generate Payroll
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {sortedRuns.map((run) => {
                const monthStr = toMonthString(run.year, run.month);
                return (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/hr/payroll/${monthStr}`)}
                    className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {monthLabel(run.month)} {run.year}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{monthStr}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(run.status)}`}>
                        {run.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Updated {formatDateTime(run.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
