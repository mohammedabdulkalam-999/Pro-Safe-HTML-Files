import { NextRequest } from "next/server";

import { apiSuccess, fromServiceFailure } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { vapiWebhookService } from "@/services/webhook";

/**
 * Vapi webhook endpoint.
 * HTTP layer only — business logic lives in services/webhook/*.
 */
export async function POST(request: NextRequest) {
  const rawBody: unknown = await request.json();

  const result = await vapiWebhookService.process({
    rawBody,
    authorizationHeader: request.headers.get("authorization"),
    vapiSecretHeader: request.headers.get("x-vapi-secret"),
  });

  if (!result.success) {
    if (result.error.statusCode === 401) {
      return fromServiceFailure(result.error);
    }

    logger.error("POST /api/vapi/webhook: returning 200 after failure", {
      code: result.error.code,
      message: result.error.message,
    });

    return apiSuccess(
      {
        received: true,
        processed: false,
        errorCode: result.error.code,
        message: result.error.message,
      },
      200,
    );
  }

  return apiSuccess(result.data, 200);
}
