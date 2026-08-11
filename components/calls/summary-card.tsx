import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  Lightbulb,
  Shield,
  UserCheck,
  XCircle,
} from "lucide-react";

import { MetricsSkeleton } from "@/components/shared/metrics-skeleton";
import { cn } from "@/lib/utils";
import type { CallSummary } from "@/types/call";

interface SummaryCardProps {
  summary: CallSummary | null;
  isLoading?: boolean;
  className?: string;
}

interface SummaryFieldCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

interface SummaryField {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: SummaryFieldCardProps["tone"];
  fullWidth?: boolean;
}

function formatBoolean(value: boolean | null | undefined): {
  text: string;
  tone: SummaryFieldCardProps["tone"];
} {
  if (value === true) {
    return { text: "Yes", tone: "success" };
  }
  if (value === false) {
    return { text: "No", tone: "muted" };
  }
  return { text: "—", tone: "muted" };
}

function formatText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "—";
}

function buildSummaryFields(summary: CallSummary): SummaryField[] {
  const structured = summary.structuredOutput;

  const leadQualified = formatBoolean(
    summary.leadQualified ?? structured?.leadQualified,
  );
  const consultationRequested = formatBoolean(
    summary.consultationRequested ?? structured?.consultationRequested,
  );
  const hasCctv = formatBoolean(
    structured?.cameraInstalled ?? structured?.hasCameras,
  );

  const monitoringType = formatText(structured?.monitoring);
  const securityIncident = formatText(structured?.securityIncident);
  const companyName = formatText(
    summary.companyName ?? structured?.companyName,
  );
  const callbackDate = formatText(
    summary.callbackDate ?? structured?.callbackDate,
  );
  const callbackTime = formatText(
    summary.callbackTime ?? structured?.callbackTime,
  );
  const recommendation = formatText(
    structured?.nextAction ?? summary.summary,
  );

  return [
    {
      key: "lead-qualified",
      icon: UserCheck,
      label: "Lead Qualified",
      value: leadQualified.text,
      tone: leadQualified.tone,
    },
    {
      key: "company-name",
      icon: Building2,
      label: "Company Name",
      value: companyName,
    },
    {
      key: "has-cctv",
      icon: Camera,
      label: "Has CCTV",
      value: hasCctv.text,
      tone: hasCctv.tone,
    },
    {
      key: "monitoring-type",
      icon: Shield,
      label: "Monitoring Type",
      value: monitoringType,
      tone: monitoringType === "—" ? "muted" : "default",
    },
    {
      key: "security-incident",
      icon: AlertTriangle,
      label: "Security Incident",
      value: securityIncident,
      tone:
        securityIncident === "—"
          ? "muted"
          : securityIncident.toLowerCase() === "none"
            ? "success"
            : "warning",
    },
    {
      key: "consultation-requested",
      icon: CalendarCheck,
      label: "Consultation Requested",
      value: consultationRequested.text,
      tone: consultationRequested.tone,
    },
    {
      key: "callback-date",
      icon: Calendar,
      label: "Callback Date",
      value: callbackDate,
      tone: callbackDate === "—" ? "muted" : "default",
    },
    {
      key: "callback-time",
      icon: Clock,
      label: "Callback Time",
      value: callbackTime,
      tone: callbackTime === "—" ? "muted" : "default",
    },
    {
      key: "recommendation",
      icon: Lightbulb,
      label: "Recommendation",
      value: recommendation,
      tone: recommendation === "—" ? "muted" : "default",
      fullWidth: true,
    },
  ];
}

const toneStyles: Record<
  NonNullable<SummaryFieldCardProps["tone"]>,
  { icon: string; value: string }
> = {
  default: {
    icon: "bg-brand-soft text-brand-teal",
    value: "text-foreground",
  },
  success: {
    icon: "bg-[rgba(46,125,50,0.12)] text-brand-success",
    value: "text-brand-success",
  },
  warning: {
    icon: "bg-[rgba(178,106,0,0.12)] text-brand-warning",
    value: "text-brand-warning",
  },
  danger: {
    icon: "bg-[rgba(180,35,24,0.12)] text-brand-danger",
    value: "text-brand-danger",
  },
  muted: {
    icon: "bg-[rgba(92,106,114,0.12)] text-brand-muted",
    value: "text-muted-foreground",
  },
};

function SummaryFieldCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  className,
}: SummaryFieldCardProps) {
  const styles = toneStyles[tone];
  const isBooleanValue = value === "Yes" || value === "No";

  return (
    <div
      className={cn(
        "rounded-md border border-[hsl(var(--brand-border)/0.5)] bg-gradient-to-b from-white to-[#f8fbfc] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 flex items-center gap-1.5 text-sm font-semibold leading-snug",
              styles.value,
              value === "—" && "font-medium",
            )}
          >
            {isBooleanValue ? (
              value === "Yes" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              )
            ) : null}
            <span className="break-words">{value}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function SummaryCard({
  summary,
  isLoading = false,
  className,
}: SummaryCardProps) {
  if (isLoading || !summary) {
    return (
      <div className={cn("admin-content-card p-5 md:p-6", className)}>
        <div className="mb-4 space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-brand-soft" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-brand-soft" />
        </div>
        <MetricsSkeleton count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
      </div>
    );
  }

  const fields = buildSummaryFields(summary);
  const narrative = summary.summary?.trim();
  const nextAction = summary.structuredOutput?.nextAction?.trim();
  const showNarrative = Boolean(narrative) && narrative !== nextAction;

  return (
    <section className={cn("admin-content-card overflow-hidden", className)}>
      <div className="border-b border-brand-border/40 px-5 py-4 md:px-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          AI Call Summary
        </h3>
        {showNarrative ? (
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {narrative}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 md:p-6">
        {fields.map((field) => (
          <SummaryFieldCard
            key={field.key}
            icon={field.icon}
            label={field.label}
            value={field.value}
            tone={field.tone}
            className={field.fullWidth ? "sm:col-span-2 xl:col-span-3" : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export { SummaryFieldCard };
