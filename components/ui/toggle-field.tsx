type ToggleFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

export function ToggleField({ checked, onChange, label, description }: ToggleFieldProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-white"
    >
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      <span
        className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
