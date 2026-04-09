import { forwardRef, type SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string | React.ReactNode;
}

interface SelectInputWithOptionsProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  value?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export const SelectInputWithOptions = forwardRef<HTMLSelectElement, SelectInputWithOptionsProps>(
  ({ value, onChange, options, placeholder, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-400 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {typeof option.label === 'string' ? option.label : option.label}
          </option>
        ))}
      </select>
    );
  }
);
