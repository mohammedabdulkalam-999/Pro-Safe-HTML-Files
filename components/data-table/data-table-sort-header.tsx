"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableSortHeaderProps {
  title: string;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
  className?: string;
}

export function DataTableSortHeader({
  title,
  sorted = false,
  onSort,
  className,
}: DataTableSortHeaderProps) {
  if (!onSort) {
    return <span className={className}>{title}</span>;
  }

  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  const ariaSort =
    sorted === "asc"
      ? "ascending"
      : sorted === "desc"
        ? "descending"
        : "none";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`Sort by ${title}`}
      aria-sort={ariaSort}
      className={cn("-ml-3 h-8 font-semibold uppercase tracking-wider", className)}
      onClick={onSort}
    >
      {title}
      <Icon className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  );
}
