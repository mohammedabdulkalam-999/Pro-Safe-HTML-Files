import { API_ROUTES } from "@/constants/api";
import type { DownloadUrls } from "@/types/call";

export function buildCallDownloadUrls(callId: string): DownloadUrls {
  return {
    txt: API_ROUTES.DOWNLOAD(callId, "txt"),
    pdf: API_ROUTES.DOWNLOAD(callId, "pdf"),
  };
}
