import { apiSuccess } from "@/lib/api-response";
import { isSupabaseConfigured } from "@/lib/env";
import { isVapiConfigured } from "@/services/vapi";
import type { HealthCheckResponse } from "@/types/api";

export async function GET() {
  const supabaseUp = isSupabaseConfigured();
  const vapiUp = isVapiConfigured();

  const status: HealthCheckResponse["status"] =
    supabaseUp && vapiUp ? "UP" : "DOWN";

  return apiSuccess({
    status,
    checks: {
      supabase: supabaseUp ? "UP" : "DOWN",
      vapi: vapiUp ? "UP" : "DOWN",
    },
  });
}
