"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Play,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import type { CampaignContact, CampaignParseResult } from "@/types/campaign";
import { parseCampaignFile } from "@/utils/campaign-parser";
import {
  CAMPAIGN_FILE_TYPES,
  CAMPAIGN_MAX_FILE_SIZE_BYTES,
} from "@/validators/campaign";

interface CampaignUploadProps {
  onStartCampaign?: (contacts: CampaignContact[]) => void;
  isSubmitting?: boolean;
}

const previewColumns: ColumnDef<CampaignContact>[] = [
  {
    accessorKey: "rowNumber",
    header: "#",
    cell: ({ row }) => row.original.rowNumber,
  },
  {
    accessorKey: "customerName",
    header: "Name",
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.phoneNumber}</span>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => row.original.notes ?? "—",
  },
];

export function CampaignUpload({
  onStartCampaign,
  isSubmitting = false,
}: CampaignUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<CampaignParseResult | null>(
    null,
  );
  const [isParsing, setIsParsing] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const extension = file.name
        .slice(file.name.lastIndexOf("."))
        .toLowerCase();

      if (
        !CAMPAIGN_FILE_TYPES.includes(
          extension as (typeof CAMPAIGN_FILE_TYPES)[number],
        )
      ) {
        toast.error("Please upload a .csv or .xml file");
        return;
      }

      if (file.size > CAMPAIGN_MAX_FILE_SIZE_BYTES) {
        toast.error("File size must be under 2 MB");
        return;
      }

      setIsParsing(true);

      try {
        const content = await file.text();
        const result = parseCampaignFile(content, file.name);
        setParseResult(result);

        if (result.valid.length === 0) {
          toast.error("No valid contacts found in file");
        } else if (result.invalid.length > 0) {
          toast.warning(
            `${result.valid.length} valid, ${result.invalid.length} skipped`,
          );
        } else {
          toast.success(`${result.valid.length} contacts loaded`);
        }
      } catch {
        toast.error("Failed to read file");
        setParseResult(null);
      } finally {
        setIsParsing(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [],
  );

  const handleClear = () => {
    setParseResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleStartCampaign = () => {
    if (!parseResult?.valid.length) {
      toast.error("Upload a file with at least one valid contact");
      return;
    }
    onStartCampaign?.(parseResult.valid);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={isParsing || isSubmitting}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {isParsing ? "Parsing..." : "Upload CSV / XML"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl"
            asChild
          >
            <a href="/templates/campaign-template.csv" download>
              <Download className="h-4 w-4" />
              Download Template
            </a>
          </Button>

          {parseResult ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>

        {parseResult?.valid.length ? (
          <Button
            type="button"
            size="lg"
            className="rounded-xl"
            disabled={isSubmitting}
            onClick={handleStartCampaign}
          >
            <Play className="h-4 w-4" />
            {isSubmitting
              ? `Calling ${parseResult.valid.length} contacts...`
              : `Start Campaign (${parseResult.valid.length})`}
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xml,text/csv,text/xml,application/xml"
        className="hidden"
        aria-label="Upload campaign file"
        onChange={handleFileSelect}
      />

      <div className="rounded-lg border border-dashed border-brand-border bg-brand-soft/50 px-4 py-3">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Campaign file format</p>
            <p className="mt-1">
              CSV columns: <code className="text-xs">number</code>,{" "}
              <code className="text-xs">name</code>,{" "}
              <code className="text-xs">another_var</code> (optional). XML:{" "}
              <code className="text-xs">&lt;contact&gt;</code> with{" "}
              <code className="text-xs">&lt;number&gt;</code> and{" "}
              <code className="text-xs">&lt;name&gt;</code>.
            </p>
          </div>
        </div>
      </div>

      {parseResult ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-foreground">
              {parseResult.fileName}
            </span>
            <span className="inline-flex items-center rounded-full bg-[rgba(46,125,50,0.12)] px-2.5 py-0.5 text-xs font-semibold text-brand-success">
              Loaded
            </span>
            <span className="text-muted-foreground">
              {parseResult.valid.length} valid
            </span>
            {parseResult.invalid.length > 0 ? (
              <span className="text-brand-warning">
                {parseResult.invalid.length} skipped
              </span>
            ) : null}
          </div>

          {parseResult.invalid.length > 0 ? (
            <div className="rounded-lg border border-brand-warning/30 bg-[rgba(178,106,0,0.06)] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-warning">
                <AlertCircle className="h-4 w-4" />
                Skipped rows
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {parseResult.invalid.slice(0, 5).map((row) => (
                  <li key={row.rowNumber}>
                    Row {row.rowNumber}: {row.error}
                    {row.customerName ? ` (${row.customerName})` : ""}
                  </li>
                ))}
                {parseResult.invalid.length > 5 ? (
                  <li>…and {parseResult.invalid.length - 5} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {parseResult.valid.length > 0 ? (
            <div className="admin-content-card overflow-hidden">
              <div className="border-b border-brand-border/40 px-4 py-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Preview ({parseResult.valid.length} contacts)
                </h3>
              </div>
              <DataTable
                columns={previewColumns}
                data={parseResult.valid}
                emptyMessage="No contacts"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
