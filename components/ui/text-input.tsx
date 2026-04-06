import { forwardRef, type InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={`w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 ${props.className ?? ""}`}
    />
  );
});
