import { MetricsSkeleton } from "@/components/shared/metrics-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function LoadingPage() {
  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-shell p-4 md:p-5">
        <div className="mb-4 h-8 w-48 animate-pulse rounded bg-brand-soft" />
        <MetricsSkeleton className="mb-4" />
        <div className="admin-content-card">
          <div className="border-b border-brand-border/40 px-4 py-3 md:px-5">
            <div className="h-4 w-32 animate-pulse rounded bg-brand-soft" />
          </div>
          <TableSkeleton rows={5} columns={4} />
        </div>
      </div>
    </div>
  );
}
