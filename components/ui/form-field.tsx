import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({ label, htmlFor, hint, error, required, children }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="block space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {required ? <span className="text-xs uppercase tracking-[0.2em] text-indigo-600">Required</span> : null}
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}
