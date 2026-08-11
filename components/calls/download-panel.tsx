import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildCallDownloadUrls } from "@/lib/download-urls";

interface DownloadPanelProps {
  callId?: string;
  disabled?: boolean;
  txtUrl?: string;
  pdfUrl?: string;
}

export function DownloadPanel({
  callId,
  disabled = false,
  txtUrl,
  pdfUrl,
}: DownloadPanelProps) {
  const resolvedUrls = callId ? buildCallDownloadUrls(callId) : null;
  const txtHref = txtUrl ?? resolvedUrls?.txt;
  const pdfHref = pdfUrl ?? resolvedUrls?.pdf;
  const canDownload = Boolean(txtHref && pdfHref) && !disabled;

  return (
    <div className="admin-content-card p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Downloads
      </h3>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="rounded-xl"
          asChild={canDownload}
          disabled={!canDownload}
        >
          {canDownload ? (
            <a href={txtHref} download aria-label="Download transcript as TXT">
              <FileText className="h-4 w-4" aria-hidden />
              Download TXT
            </a>
          ) : (
            <>
              <FileText className="h-4 w-4" aria-hidden />
              Download TXT
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          asChild={canDownload}
          disabled={!canDownload}
        >
          {canDownload ? (
            <a href={pdfHref} download aria-label="Download transcript as PDF">
              <Download className="h-4 w-4" aria-hidden />
              Download PDF
            </a>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
