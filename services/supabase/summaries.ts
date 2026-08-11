import { createServerSupabaseClient } from "@/lib/supabase";
import { mapSummaryRowToModel } from "@/services/supabase/mappers";
import {
  SupabaseServiceError,
  wrapServiceError,
} from "@/services/supabase/errors";
import type { CallSummary } from "@/types/call";
import type {
  DB_TABLES,
  InsertSummaryRow,
  UpdateSummaryRow,
} from "@/types/database";

const TABLE = "summaries" as const satisfies (typeof DB_TABLES)["SUMMARIES"];

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

export async function createSummary(
  input: InsertSummaryRow,
): Promise<CallSummary> {
  const operation = "createSummary";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        call_id: input.call_id,
        lead_qualified: input.lead_qualified ?? null,
        consultation_requested: input.consultation_requested ?? null,
        company_name: input.company_name ?? null,
        callback_date: input.callback_date ?? null,
        callback_time: input.callback_time ?? null,
        summary: input.summary ?? null,
        structured_output: input.structured_output ?? null,
      })
      .select()
      .single();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    if (!data) {
      throw new SupabaseServiceError(
        "Failed to create summary — no data returned",
        {
          code: "QUERY_FAILED",
          operation,
          table: TABLE,
        },
      );
    }

    return mapSummaryRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function getSummaryByCallId(
  callId: string,
): Promise<CallSummary | null> {
  const operation = "getSummaryByCallId";

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

    return data ? mapSummaryRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function getSummaryById(id: string): Promise<CallSummary | null> {
  const operation = "getSummaryById";

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

    return data ? mapSummaryRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function updateSummaryByCallId(
  callId: string,
  input: UpdateSummaryRow,
): Promise<CallSummary> {
  const operation = "updateSummaryByCallId";

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
      throw new SupabaseServiceError("Summary not found", {
        code: "NOT_FOUND",
        operation,
        table: TABLE,
      });
    }

    return mapSummaryRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function upsertSummaryByCallId(
  callId: string,
  input: Omit<InsertSummaryRow, "call_id">,
): Promise<CallSummary> {
  const operation = "upsertSummaryByCallId";

  try {
    const existing = await getSummaryByCallId(callId);

    if (existing) {
      return updateSummaryByCallId(callId, input);
    }

    return createSummary({ call_id: callId, ...input });
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function deleteSummaryByCallId(callId: string): Promise<void> {
  const operation = "deleteSummaryByCallId";

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

export async function countQualifiedLeads(): Promise<number> {
  const operation = "countQualifiedLeads";

  try {
    const supabase = getClient();

    const { count, error } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("lead_qualified", true);

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    return count ?? 0;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}
