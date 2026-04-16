import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonKPICards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 xl:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border/50 rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="w-11 h-11 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <div className="border-b border-border/50 px-6 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${60 + i * 20}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-border/30 px-6 py-4 flex gap-4 items-center">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} className="h-3" style={{ width: `${50 + j * 15}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Skeleton className="h-7 flex-1 rounded-lg" />
            <Skeleton className="h-7 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <SkeletonKPICards count={6} />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 border border-border/50 rounded-xl p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 rounded-lg" style={{ width: `${100 - i * 15}%` }} />
            </div>
          ))}
        </div>
        <div className="xl:col-span-3 border border-border/50 rounded-xl p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[220px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
