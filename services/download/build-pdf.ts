import {
  PDFDocument,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  rgb,
} from "pdf-lib";

import type { CallDownloadInput, DownloadFileResult } from "@/services/download/types";
import {
  buildDownloadFooter,
  formatGeneratedTimestamp,
  getAssistantLabel,
  getConversationMessages,
  getCustomerLabel,
  getSummaryText,
} from "@/services/download/formatters";
import { formatDuration } from "@/utils/call";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  headerBg: rgb(0.05, 0.36, 0.42),
  headerText: rgb(1, 1, 1),
  title: rgb(0.1, 0.16, 0.22),
  label: rgb(0.45, 0.5, 0.55),
  body: rgb(0.15, 0.18, 0.22),
  muted: rgb(0.55, 0.58, 0.62),
  divider: rgb(0.82, 0.86, 0.88),
  assistant: rgb(0.08, 0.4, 0.75),
  customer: rgb(0.12, 0.55, 0.45),
};

interface PdfLayoutContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [""];
}

function ensureSpace(
  ctx: PdfLayoutContext,
  requiredHeight: number,
): PdfLayoutContext {
  if (ctx.y - requiredHeight >= MARGIN) {
    return ctx;
  }

  const page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { ...ctx, page, y: PAGE_HEIGHT - MARGIN };
}

function drawWrappedText(
  ctx: PdfLayoutContext,
  text: string,
  options: {
    font: PDFFont;
    size: number;
    color: ReturnType<typeof rgb>;
    indent?: number;
    lineHeight?: number;
  },
): PdfLayoutContext {
  const indent = options.indent ?? 0;
  const lineHeight = options.lineHeight ?? options.size + 4;
  const lines = wrapText(text, options.font, options.size, CONTENT_WIDTH - indent);
  let next = ctx;

  for (const line of lines) {
    next = ensureSpace(next, lineHeight);
    next.page.drawText(line, {
      x: MARGIN + indent,
      y: next.y,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    next = { ...next, y: next.y - lineHeight };
  }

  return next;
}

function drawSectionTitle(ctx: PdfLayoutContext, title: string): PdfLayoutContext {
  let next = ensureSpace(ctx, 28);
  next.page.drawLine({
    start: { x: MARGIN, y: next.y + 8 },
    end: { x: PAGE_WIDTH - MARGIN, y: next.y + 8 },
    thickness: 1,
    color: COLORS.divider,
  });
  next = { ...next, y: next.y - 10 };
  next.page.drawText(title, {
    x: MARGIN,
    y: next.y,
    size: 12,
    font: next.bold,
    color: COLORS.title,
  });
  return { ...next, y: next.y - 22 };
}

function drawMetadataRow(
  ctx: PdfLayoutContext,
  label: string,
  value: string,
): PdfLayoutContext {
  const next = ensureSpace(ctx, 18);
  next.page.drawText(label, {
    x: MARGIN,
    y: next.y,
    size: 9,
    font: next.bold,
    color: COLORS.label,
  });
  next.page.drawText(value, {
    x: MARGIN + 92,
    y: next.y,
    size: 10,
    font: next.regular,
    color: COLORS.body,
  });
  return { ...next, y: next.y - 18 };
}

function drawHeaderBand(ctx: PdfLayoutContext, generatedAt: Date): PdfLayoutContext {
  const bandHeight = 72;
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - bandHeight,
    width: PAGE_WIDTH,
    height: bandHeight,
    color: COLORS.headerBg,
  });

  ctx.page.drawText("Pro-Vigil", {
    x: MARGIN,
    y: PAGE_HEIGHT - 34,
    size: 18,
    font: ctx.bold,
    color: COLORS.headerText,
  });

  ctx.page.drawText("AI Sales Call Transcript", {
    x: MARGIN,
    y: PAGE_HEIGHT - 54,
    size: 11,
    font: ctx.regular,
    color: rgb(0.88, 0.95, 0.96),
  });

  const generatedLabel = formatGeneratedTimestamp(generatedAt);
  const generatedWidth = ctx.regular.widthOfTextAtSize(generatedLabel, 8);
  ctx.page.drawText(generatedLabel, {
    x: PAGE_WIDTH - MARGIN - generatedWidth,
    y: PAGE_HEIGHT - 34,
    size: 8,
    font: ctx.regular,
    color: rgb(0.88, 0.95, 0.96),
  });

  return { ...ctx, y: PAGE_HEIGHT - bandHeight - 28 };
}

export async function buildCallTranscriptPdf(
  input: CallDownloadInput,
): Promise<DownloadFileResult> {
  const generatedAt = input.generatedAt ?? new Date();
  const assistantName = getAssistantLabel(input.row.assistantName);
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let ctx: PdfLayoutContext = {
    pdfDoc,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    regular,
    bold,
  };

  ctx = drawHeaderBand(ctx, generatedAt);
  ctx = drawMetadataRow(ctx, "Customer", getCustomerLabel(input.row));
  ctx = drawMetadataRow(ctx, "Phone", input.row.phoneNumber);
  ctx = drawMetadataRow(
    ctx,
    "Duration",
    formatDuration(input.row.durationSeconds),
  );
  ctx = drawMetadataRow(ctx, "Call ID", input.row.callId);
  ctx = { ...ctx, y: ctx.y - 8 };

  ctx = drawSectionTitle(ctx, "Conversation");
  const messages = getConversationMessages(input.row);

  if (messages.length === 0) {
    ctx = drawWrappedText(ctx, "No conversation recorded.", {
      font: regular,
      size: 10,
      color: COLORS.muted,
    });
  } else {
    for (const message of messages) {
      const speakerLabel =
        message.speaker === "assistant" ? assistantName : "Customer";
      const speakerColor =
        message.speaker === "assistant" ? COLORS.assistant : COLORS.customer;

      ctx = ensureSpace(ctx, 20);
      ctx.page.drawText(speakerLabel, {
        x: MARGIN,
        y: ctx.y,
        size: 9,
        font: bold,
        color: speakerColor,
      });
      ctx = { ...ctx, y: ctx.y - 14 };

      ctx = drawWrappedText(ctx, message.message, {
        font: regular,
        size: 10,
        color: COLORS.body,
        indent: 8,
        lineHeight: 14,
      });
      ctx = { ...ctx, y: ctx.y - 8 };
    }
  }

  ctx = drawSectionTitle(ctx, "Summary");
  const summaryText = getSummaryText(input.summary);

  ctx = drawWrappedText(
    ctx,
    summaryText ?? "No summary available.",
    {
      font: regular,
      size: 10,
      color: summaryText ? COLORS.body : COLORS.muted,
      lineHeight: 14,
    },
  );

  const footerLines = buildDownloadFooter(generatedAt);
  ctx = { ...ctx, y: ctx.y - 10 };
  ctx = drawWrappedText(ctx, footerLines[footerLines.length - 1] ?? "", {
    font: regular,
    size: 8,
    color: COLORS.muted,
    lineHeight: 12,
  });

  const bytes = await pdfDoc.save();

  return {
    body: bytes,
    contentType: "application/pdf",
    filename: `call-${input.row.callId}.pdf`,
  };
}
