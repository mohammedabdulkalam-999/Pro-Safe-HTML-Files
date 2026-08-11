import { NextRequest } from "next/server";

import {
  apiError,
  apiSuccess,
  fromResult,
  handleApiError,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { createCall } from "@/services/calls";
import {
  listDashboardCalls,
  mapCallRecordToListItem,
} from "@/services/supabase";
import { createCallRequestSchema } from "@/validators/call";
import { callsListQuerySchema } from "@/validators/calls-list";

export async function GET(request: NextRequest) {
  try {
    const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = callsListQuerySchema.safeParse(rawParams);

    if (!parsed.success) {
      const message =
        parsed.error.errors[0]?.message ?? "Invalid query parameters";
      return apiError(message, 400, "VALIDATION");
    }

    const { page, limit, status, search, sortBy, sortOrder } = parsed.data;

    const result = await listDashboardCalls({
      status,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const items = result.data.map(mapCallRecordToListItem);

    return apiSuccess({
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    logger.error("GET /api/calls failed", {
      error: error instanceof Error ? error.message : error,
    });
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = createCallRequestSchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.errors[0]?.message ?? "Invalid request body";
      logger.warn("POST /api/calls validation failed", {
        issues: parsed.error.errors.map((e) => e.message),
      });
      return apiError(message, 400, "VALIDATION");
    }

    const result = await createCall(parsed.data);

    return fromResult(result, 201);
  } catch (error) {
    logger.error("POST /api/calls unexpected failure", {
      error: error instanceof Error ? error.message : error,
    });
    return handleApiError(error);
  }
}
