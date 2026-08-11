import { buildCallTranscriptPdf } from "@/services/download/build-pdf";
import { buildCallTranscriptTxt } from "@/services/download/build-txt";
import type {
  CallDownloadInput,
  DownloadFileResult,
  DownloadFormat,
} from "@/services/download/types";

/** Generates call transcript downloads in TXT or PDF format. */
export class CallDownloadService {
  buildTxt(input: CallDownloadInput): DownloadFileResult {
    return buildCallTranscriptTxt(input);
  }

  async buildPdf(input: CallDownloadInput): Promise<DownloadFileResult> {
    return buildCallTranscriptPdf(input);
  }

  async build(
    format: DownloadFormat,
    input: CallDownloadInput,
  ): Promise<DownloadFileResult> {
    if (format === "txt") {
      return this.buildTxt(input);
    }

    return this.buildPdf(input);
  }
}

export const callDownloadService = new CallDownloadService();

export async function buildCallDownload(
  format: DownloadFormat,
  input: CallDownloadInput,
): Promise<DownloadFileResult> {
  return callDownloadService.build(format, input);
}
