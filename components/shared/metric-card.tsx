import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
  className?: string;
}

const trendColorMap = {
  up: "text-brand-success",
  down: "text-brand-danger",
  flat: "text-brand-info",
} as const;

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("admin-kpi-card animate-slide-up", className)}>
      <span className="admin-kpi-label">{label}</span>
      <span className="admin-kpi-value">{value}</span>
      {(subtext || trend) && (
        <div className="flex items-center justify-between gap-2 text-[0.8125rem] text-muted-foreground">
          {subtext ? <span>{subtext}</span> : <span />}
          {trend ? (
            <span className={cn("font-semibold", trendColorMap[trend.direction])}>
              {trend.value}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
