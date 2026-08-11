import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import {
  buildCallDetail,
  deleteCallById,
  getDashboardCallById,
  getSummaryByCallId,
} from "@/services/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const row = await getDashboardCallById(id);
    if (!row) {
      return apiError("Call not found", 404, "NOT_FOUND");
    }

    const summary = await getSummaryByCallId(id);
    const detail = buildCallDetail(row, summary);

    return apiSuccess(detail);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await getDashboardCallById(id);
    if (!existing) {
      return apiError("Call not found", 404, "NOT_FOUND");
    }

    await deleteCallById(id);
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
