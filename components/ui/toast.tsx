type ToastProps = {
  kind: "success" | "error";
  message: string;
};

export function Toast({ kind, message }: ToastProps) {
  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-2xl ${
        kind === "success"
          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 dark:border-emerald-500/60 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "border-rose-400/40 bg-rose-500/15 text-rose-100 dark:border-rose-500/60 dark:bg-rose-900/40 dark:text-rose-200"
      }`}
    >
      {message}
    </div>
  );
}
