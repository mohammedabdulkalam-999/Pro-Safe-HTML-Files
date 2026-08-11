import {
  parseWebhook,
  resolveWebhookEventKinds,
} from "@/services/vapi";
import type { NormalizedVapiWebhookDto } from "@/types/dto/vapi-webhook.dto";

/** Parses and normalizes raw Vapi webhook payloads. */
export class VapiWebhookNormalizerService {
  normalize(rawBody: unknown): NormalizedVapiWebhookDto {
    const parsed = parseWebhook(rawBody);

    return {
      ...parsed,
      eventKinds: resolveWebhookEventKinds(parsed),
    };
  }
}

export const vapiWebhookNormalizerService = new VapiWebhookNormalizerService();
