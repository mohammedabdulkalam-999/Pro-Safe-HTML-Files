"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_ASSISTANT_NAME } from "@/constants/api";
import { cn } from "@/lib/utils";
import type { TranscriptMessage } from "@/types/call";
import {
  formatTranscriptTimestamp,
  splitMessageForHighlight,
} from "@/utils/transcript";

interface TranscriptMessageBubbleProps {
  message: TranscriptMessage;
  assistantName?: string;
  searchQuery?: string;
  className?: string;
}

export function TranscriptMessageBubble({
  message,
  assistantName = DEFAULT_ASSISTANT_NAME,
  searchQuery = "",
  className,
}: TranscriptMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.speaker === "assistant";
  const speakerLabel = isAssistant ? assistantName : "Customer";
  const timestamp = formatTranscriptTimestamp(message.timestamp);
  const segments = splitMessageForHighlight(message.message, searchQuery);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.message);
      setCopied(true);
      toast.success("Message copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy message");
    }
  }, [message.message]);

  return (
    <div
      className={cn(
        "group flex w-full gap-2 sm:gap-3",
        isAssistant ? "justify-start" : "justify-end",
        className,
      )}
    >
      <div
        className={cn(
          "relative max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 shadow-sm transition-colors",
          isAssistant
            ? "rounded-tl-md bg-[rgba(21,101,192,0.1)] text-foreground ring-1 ring-[rgba(21,101,192,0.15)]"
            : "rounded-tr-md border border-brand-border/60 bg-white text-foreground",
        )}
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-xs font-semibold",
              isAssistant ? "text-brand-info" : "text-brand-teal",
            )}
          >
            {speakerLabel}
          </span>
          {timestamp ? (
            <time
              dateTime={message.timestamp}
              className="text-[0.6875rem] text-muted-foreground"
            >
              {timestamp}
            </time>
          ) : null}
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {segments.map((segment, index) =>
            segment.highlight ? (
              <mark
                key={index}
                className="rounded bg-brand-warning/25 px-0.5 text-inherit"
              >
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "absolute -right-2 -top-2 h-7 w-7 rounded-full border bg-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                !isAssistant && "-left-2 right-auto",
              )}
              onClick={() => void handleCopy()}
              aria-label={`Copy ${speakerLabel} message`}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy message</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
