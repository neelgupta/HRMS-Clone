import { forwardRef } from "react";

interface TextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ value, onChange, placeholder, rows = 4, className = "", disabled = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        disabled={disabled}
        {...props}
      />
    );
  }
);
