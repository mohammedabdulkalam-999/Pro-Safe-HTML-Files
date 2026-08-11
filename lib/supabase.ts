import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export type { Database };
export type TypedSupabaseClient = SupabaseClient<Database>;

let serverClient: TypedSupabaseClient | null = null;

/**
 * Server-side Supabase client using the service role key.
 * Use ONLY in API routes, server actions, and the service layer.
 * Never import this in React client components.
 */
export function createServerSupabaseClient(): TypedSupabaseClient {
  if (serverClient) {
    return serverClient;
  }

  const env = getServerEnv();

  serverClient = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return serverClient;
}

/**
 * Browser-safe client using the anon key.
 * Provided for future client-side auth only — do NOT use for data queries.
 * All data access must go through API routes + service layer.
 */
export function createBrowserSupabaseClient(): TypedSupabaseClient {
  const env = getPublicEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
}

/** Reset cached server client (useful in tests) */
export function resetServerSupabaseClient(): void {
  serverClient = null;
}
