import { createServerSupabaseClient } from "@/lib/supabase";
import { mapTranscriptRowToModel } from "@/services/supabase/mappers";
import {
  SupabaseServiceError,
  wrapServiceError,
} from "@/services/supabase/errors";
import type { CallTranscript } from "@/types/call";
import type {
  InsertTranscriptRow,
  UpdateTranscriptRow,
} from "@/types/database";

const TABLE = "transcripts" as const;

function getClient() {
  try {
    return createServerSupabaseClient();
  } catch (error) {
    throw new SupabaseServiceError(
      "Supabase is not configured. Set environment variables in .env.local",
      {
        code: "NOT_CONFIGURED",
        operation: "getClient",
        originalError: error instanceof Error ? error : undefined,
      },
    );
  }
}

export async function createTranscript(
  input: InsertTranscriptRow,
): Promise<CallTranscript> {
  const operation = "createTranscript";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        call_id: input.call_id,
        transcript: input.transcript ?? null,
        raw_transcript: input.raw_transcript ?? null,
      })
      .select()
      .single();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    if (!data) {
      throw new SupabaseServiceError(
        "Failed to create transcript — no data returned",
        {
          code: "QUERY_FAILED",
          operation,
          table: TABLE,
        },
      );
    }

    return mapTranscriptRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function getTranscriptByCallId(
  callId: string,
): Promise<CallTranscript | null> {
  const operation = "getTranscriptByCallId";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("call_id", callId)
      .maybeSingle();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    return data ? mapTranscriptRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function getTranscriptById(
  id: string,
): Promise<CallTranscript | null> {
  const operation = "getTranscriptById";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    return data ? mapTranscriptRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function updateTranscriptByCallId(
  callId: string,
  input: UpdateTranscriptRow,
): Promise<CallTranscript> {
  const operation = "updateTranscriptByCallId";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .update(input)
      .eq("call_id", callId)
      .select()
      .single();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    if (!data) {
      throw new SupabaseServiceError("Transcript not found", {
        code: "NOT_FOUND",
        operation,
        table: TABLE,
      });
    }

    return mapTranscriptRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function upsertTranscriptByCallId(
  callId: string,
  input: Omit<InsertTranscriptRow, "call_id">,
): Promise<CallTranscript> {
  const operation = "upsertTranscriptByCallId";

  try {
    const existing = await getTranscriptByCallId(callId);

    if (existing) {
      return updateTranscriptByCallId(callId, input);
    }

    return createTranscript({ call_id: callId, ...input });
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function deleteTranscriptByCallId(callId: string): Promise<void> {
  const operation = "deleteTranscriptByCallId";

  try {
    const supabase = getClient();

    const { error } = await supabase.from(TABLE).delete().eq("call_id", callId);

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}
