import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricsSkeletonProps {
  count?: number;
  className?: string;
}

export function MetricsSkeleton({
  count = 4,
  className,
}: MetricsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-kpi-card space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
