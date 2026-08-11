import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RetryStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function RetryState({
  title = "Something went wrong",
  description = "We could not load this data. Please try again.",
  onRetry,
  isRetrying = false,
  className,
}: RetryStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(180,35,24,0.12)] text-brand-danger">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onRetry} disabled={isRetrying} variant="outline">
        <RefreshCw className={cn(isRetrying && "animate-spin")} />
        {isRetrying ? "Retrying…" : "Retry"}
      </Button>
    </div>
  );
}
