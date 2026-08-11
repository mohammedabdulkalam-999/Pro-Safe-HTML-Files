import { NextRequest } from "next/server";

import { apiError, handleApiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { callDownloadService } from "@/services/download";
import {
  getDashboardCallById,
  getSummaryByCallId,
} from "@/services/supabase";
import { downloadQuerySchema } from "@/validators/call";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formatParam = request.nextUrl.searchParams.get("format");
    const parsed = downloadQuerySchema.safeParse({ format: formatParam });

    if (!parsed.success) {
      return apiError("Invalid format. Use txt or pdf.", 400, "VALIDATION");
    }

    const row = await getDashboardCallById(id);
    if (!row) {
      return apiError("Call not found", 404, "NOT_FOUND");
    }

    const summary = await getSummaryByCallId(id);
    const result = await callDownloadService.build(parsed.data.format, {
      row,
      summary,
      generatedAt: new Date(),
    });

    const body =
      typeof result.body === "string"
        ? result.body
        : Buffer.from(result.body);

    return new Response(body, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    logger.error("GET /api/download/[id] failed", {
      error: error instanceof Error ? error.message : error,
    });
    return handleApiError(error);
  }
}
