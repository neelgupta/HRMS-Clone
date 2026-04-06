type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className = "", label = "Loading" }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-label={label}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  );
}
