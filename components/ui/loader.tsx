"use client";

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 dark:border-indigo-900"></div>
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2"></div>
      </div>
    </div>
  );
}

export function TableLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-lg w-1/3"></div>
            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-lg w-1/4"></div>
          </div>
          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
        </div>
      ))}
    </div>
  );
}

export function ProfileLoader() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 bg-gradient-to-br from-slate-200 dark:from-slate-600 to-slate-300 dark:to-slate-700 rounded-2xl"></div>
            <div className="mt-4 h-6 bg-slate-200 dark:bg-slate-600 rounded-lg w-32"></div>
            <div className="mt-2 h-4 bg-slate-200 dark:bg-slate-600 rounded-lg w-24"></div>
            <div className="mt-4 w-20 h-6 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl">
                <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardLoader() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-span-12 lg:col-span-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-40"></div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-32"></div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-64"></div>
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 h-64"></div>
      </div>
    </div>
  );
}
