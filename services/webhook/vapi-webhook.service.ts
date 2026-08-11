import { logger } from "@/lib/logger";
import { isVapiServiceError } from "@/services/vapi";
import { isSupabaseServiceError } from "@/services/supabase/errors";
import { getHttpStatusFromServiceError } from "@/services/supabase/http";
import {
  VapiWebhookAuthService,
  vapiWebhookAuthService,
} from "@/services/webhook/vapi-webhook-auth.service";
import {
  VapiWebhookNormalizerService,
  vapiWebhookNormalizerService,
} from "@/services/webhook/vapi-webhook-normalizer.service";
import {
  VapiWebhookPersistenceService,
  vapiWebhookPersistenceService,
} from "@/services/webhook/vapi-webhook-persistence.service";
import type {
  VapiWebhookProcessResultDto,
  VapiWebhookRequestDto,
} from "@/types/dto/vapi-webhook.dto";
import { err, ok, type Result, type ServiceFailure } from "@/types/result";

const OPERATION = "vapiWebhook";

function toFailure(
  code: string,
  message: string,
  statusCode: number,
  cause?: unknown,
): ServiceFailure {
  return { code, message, statusCode, cause };
}

/** Orchestrates Vapi webhook auth → normalize → persist. */
export class VapiWebhookService {
  constructor(
    private readonly auth: VapiWebhookAuthService = vapiWebhookAuthService,
    private readonly normalizer: VapiWebhookNormalizerService = vapiWebhookNormalizerService,
    private readonly persistence: VapiWebhookPersistenceService = vapiWebhookPersistenceService,
  ) {}

  async process(
    request: VapiWebhookRequestDto,
  ): Promise<Result<VapiWebhookProcessResultDto, ServiceFailure>> {
    logger.info(`${OPERATION}: event received`);

    if (!this.auth.verifyRequest(request)) {
      const failure = toFailure(
        "UNAUTHORIZED",
        "Unauthorized webhook request",
        401,
      );
      logger.warn(`${OPERATION}: secret validation failed`);
      return err(failure);
    }

    try {
      const normalized = this.normalizer.normalize(request.rawBody);

      logger.info(`${OPERATION}: payload normalized`, {
        vapiCallId: normalized.vapiCallId,
        messageType: normalized.messageType,
        eventKinds: normalized.eventKinds,
      });

      const persistence = await this.persistence.persist(normalized);

      logger.info(`${OPERATION}: persistence complete`, {
        vapiCallId: persistence.vapiCallId,
        processed: persistence.processed,
        skipped: persistence.skipped,
        actions: persistence.actions,
      });

      return ok({
        received: true,
        vapiCallId: persistence.vapiCallId,
        messageType: normalized.messageType,
        eventKinds: normalized.eventKinds,
        processed: persistence.processed,
        skipped: persistence.skipped,
        reason: persistence.reason,
        actions: persistence.actions,
      });
    } catch (error) {
      const failure = this.mapError(error);

      logger.error(`${OPERATION}: processing failed`, {
        code: failure.code,
        message: failure.message,
        cause: failure.cause instanceof Error ? failure.cause.message : failure.cause,
      });

      return err(failure);
    }
  }

  private mapError(error: unknown): ServiceFailure {
    if (isVapiServiceError(error)) {
      return toFailure(
        error.code,
        error.message,
        error.code === "WEBHOOK_INVALID" ? 400 : 500,
        error,
      );
    }

    if (isSupabaseServiceError(error)) {
      return toFailure(
        error.code,
        error.message,
        getHttpStatusFromServiceError(error),
        error,
      );
    }

    if (error instanceof Error) {
      return toFailure("WEBHOOK_ERROR", error.message, 500, error);
    }

    return toFailure(
      "WEBHOOK_ERROR",
      "Webhook processing failed",
      500,
      error,
    );
  }
}

export const vapiWebhookService = new VapiWebhookService();
