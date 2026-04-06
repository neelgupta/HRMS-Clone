type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-[loaderFadeIn_220ms_ease-out] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700 ${className}`} aria-hidden="true" />;
}
