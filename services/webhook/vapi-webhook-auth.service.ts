import { verifyWebhookSecret } from "@/services/vapi";
import type { VapiWebhookRequestDto } from "@/types/dto/vapi-webhook.dto";

export interface WebhookAuthHeaders {
  authorizationHeader: string | null;
  vapiSecretHeader: string | null;
}

/** Validates Vapi webhook request authenticity. */
export class VapiWebhookAuthService {
  verify(headers: WebhookAuthHeaders, secret?: string): boolean {
    return verifyWebhookSecret({
      secret: secret ?? process.env.VAPI_WEBHOOK_SECRET,
      authorizationHeader: headers.authorizationHeader,
      vapiSecretHeader: headers.vapiSecretHeader,
    });
  }

  verifyRequest(request: VapiWebhookRequestDto, secret?: string): boolean {
    return this.verify(
      {
        authorizationHeader: request.authorizationHeader,
        vapiSecretHeader: request.vapiSecretHeader,
      },
      secret,
    );
  }
}

export const vapiWebhookAuthService = new VapiWebhookAuthService();
