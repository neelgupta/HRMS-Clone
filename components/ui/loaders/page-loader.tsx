type PageLoaderProps = {
  label?: string;
  message?: string;
};

export function PageLoader({
  label = "Loading",
  message = "Preparing your workspace...",
}: PageLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 dark:bg-slate-900">
      <div className="flex animate-[loaderFadeIn_240ms_ease-out] flex-col items-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20 blur-xl dark:opacity-40" />
          <div className="h-14 w-14 animate-spin rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#2563eb_0deg,#4f46e5_140deg,#a855f7_280deg,#2563eb_360deg)] p-[3px] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
            <div className="h-full w-full rounded-full bg-slate-50 dark:bg-slate-800" />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">WorkNest</p>
          <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{label}</h1>
          <p className="mt-2 animate-pulse text-sm text-slate-500 dark:text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );
}
