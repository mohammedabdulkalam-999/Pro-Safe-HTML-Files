import type { StatusBadgeVariant } from "@/constants/call-status";
import { CALL_STATUS_LABELS } from "@/constants/call-status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StatusBadgeVariant;
  pulse?: boolean;
  className?: string;
}

const statusStyles: Record<StatusBadgeVariant, string> = {
  completed: "bg-[rgba(46,125,50,0.12)] text-brand-success",
  "in-progress": "bg-[rgba(21,101,192,0.12)] text-brand-info",
  calling: "bg-[rgba(21,101,192,0.12)] text-brand-info",
  initiated: "bg-[rgba(21,101,192,0.12)] text-brand-info",
  ringing: "bg-[rgba(21,101,192,0.12)] text-brand-info",
  failed: "bg-[rgba(180,35,24,0.12)] text-brand-danger",
  busy: "bg-[rgba(178,106,0,0.12)] text-brand-warning",
  "no-answer": "bg-[rgba(92,106,114,0.12)] text-brand-muted",
  voicemail: "bg-[rgba(92,106,114,0.12)] text-brand-muted",
  idle: "bg-[rgba(92,106,114,0.12)] text-brand-muted",
  listening: "bg-[rgba(21,101,192,0.12)] text-brand-info",
  talking: "bg-[rgba(46,125,50,0.12)] text-brand-success",
};

const statusLabels: Record<StatusBadgeVariant, string> = {
  ...CALL_STATUS_LABELS,
  calling: "Calling",
  idle: "Idle",
  listening: "Listening",
  talking: "Talking",
};

export function StatusBadge({ status, pulse = false, className }: StatusBadgeProps) {
  const shouldPulse =
    pulse ||
    status === "calling" ||
    status === "ringing" ||
    status === "in-progress";

  return (
    <span
      role="status"
      aria-label={`Status: ${statusLabels[status]}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
        shouldPulse && "animate-pulse-status",
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
