"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Search, X } from "lucide-react";

import { TranscriptMessageBubble } from "@/components/calls/transcript-message-bubble";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_ASSISTANT_NAME } from "@/constants/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { TranscriptMessage } from "@/types/call";
import { messageMatchesSearch } from "@/utils/transcript";

interface TranscriptViewerProps {
  messages: TranscriptMessage[];
  assistantName?: string;
  isLoading?: boolean;
  autoScroll?: boolean;
  showSearch?: boolean;
  bordered?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

const SCROLL_THRESHOLD_PX = 80;

export function TranscriptViewer({
  messages,
  assistantName = DEFAULT_ASSISTANT_NAME,
  isLoading = false,
  autoScroll = true,
  showSearch = true,
  bordered = true,
  className,
  emptyTitle = "No transcript yet",
  emptyDescription = "Messages will appear here as the call progresses.",
}: TranscriptViewerProps) {
  const [searchInput, setSearchInput] = useState("");
  const [stickToBottom, setStickToBottom] = useState(true);
  const debouncedSearch = useDebouncedValue(searchInput, 200);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredMessages = useMemo(
    () =>
      messages.filter((message) =>
        messageMatchesSearch(message.message, debouncedSearch),
      ),
    [messages, debouncedSearch],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setStickToBottom(distanceFromBottom <= SCROLL_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    if (!autoScroll || !stickToBottom || isLoading) return;
    scrollToBottom(messages.length > 3 ? "smooth" : "auto");
  }, [autoScroll, stickToBottom, isLoading, messages, scrollToBottom]);

  if (isLoading) {
    return <TableSkeleton rows={6} columns={1} className="max-w-3xl" />;
  }

  const searchHeader = showSearch ? (
    <>
      <div className="space-y-3 p-4 pb-3 md:p-5 md:pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search transcript…"
            className="pl-9 pr-9"
            aria-label="Search transcript"
          />
          {searchInput ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {debouncedSearch ? (
          <p className="text-xs text-muted-foreground">
            {filteredMessages.length} of {messages.length} message
            {messages.length === 1 ? "" : "s"} match
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      <Separator />
    </>
  ) : null;

  const conversation = (
    <div className="relative p-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "flex flex-col gap-4 overflow-y-auto px-4 py-4 md:px-5 md:py-5",
          bordered
            ? "max-h-[min(70vh,720px)] min-h-[280px]"
            : "max-h-[480px] min-h-[200px]",
        )}
      >
        {messages.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : filteredMessages.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Try a different search term."
          />
        ) : (
          filteredMessages.map((message, index) => (
            <TranscriptMessageBubble
              key={`${message.speaker}-${message.timestamp ?? index}-${index}`}
              message={message}
              assistantName={assistantName}
              searchQuery={debouncedSearch}
            />
          ))
        )}
        <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </div>

      {autoScroll && !stickToBottom && filteredMessages.length > 0 ? (
        <div className="pointer-events-none absolute bottom-4 right-4 md:bottom-5 md:right-5">
            <Button
              type="button"
              size="sm"
              className="pointer-events-auto rounded-full shadow-md"
              onClick={() => {
                setStickToBottom(true);
                scrollToBottom();
              }}
              aria-label="Jump to latest messages"
            >
            <ArrowDown className="h-4 w-4" />
            Jump to latest
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (!bordered) {
    return (
      <div className={cn("overflow-hidden", className)}>
        {searchHeader}
        {conversation}
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden border-brand-border/40 shadow-none", className)}>
      {searchHeader ? <CardHeader className="p-0">{searchHeader}</CardHeader> : null}
      <CardContent className="p-0">{conversation}</CardContent>
    </Card>
  );
}
