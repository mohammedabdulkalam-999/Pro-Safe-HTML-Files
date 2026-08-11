import type { CallStatus } from "@/constants/call-status";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  mapCallRowToModel,
  mapDashboardRowToModel,
} from "@/services/supabase/mappers";
import {
  SupabaseServiceError,
  wrapServiceError,
} from "@/services/supabase/errors";
import type { CallDashboardRow, CallRecord } from "@/types/call";
import type {
  InsertCallRow,
  UpdateCallRow,
} from "@/types/database";
import type { CallsListSortField } from "@/validators/calls-list";

const TABLE = "calls" as const;
const VIEW = "call_dashboard" as const;

export interface ListCallsFilters {
  status?: CallStatus;
  customer?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: CallsListSortField;
  sortOrder?: "asc" | "desc";
}

export interface ListCallsResult<T = CallRecord> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

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

export async function createCall(input: InsertCallRow): Promise<CallRecord> {
  const operation = "createCall";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        ...input,
        customer_name: input.customer_name ?? null,
        duration_seconds: input.duration_seconds ?? 0,
        started_at: input.started_at ?? null,
        ended_at: input.ended_at ?? null,
        assistant_name: input.assistant_name ?? "Sarah",
      })
      .select()
      .single();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    if (!data) {
      throw new SupabaseServiceError("Failed to create call — no data returned", {
        code: "QUERY_FAILED",
        operation,
        table: TABLE,
      });
    }

    return mapCallRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function getCallById(id: string): Promise<CallRecord | null> {
  const operation = "getCallById";

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

    return data ? mapCallRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function getCallByCallId(
  callId: string,
): Promise<CallRecord | null> {
  const operation = "getCallByCallId";

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

    return data ? mapCallRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function listCalls(
  filters: ListCallsFilters = {},
): Promise<ListCallsResult> {
  const operation = "listCalls";
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;

  try {
    const supabase = getClient();

    let query = supabase
      .from(TABLE)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.customer) {
      query = query.ilike("customer_name", `%${filters.customer}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    return {
      data: (data ?? []).map(mapCallRowToModel),
      total: count ?? 0,
      page,
      limit,
    };
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function listDashboardCalls(
  filters: ListCallsFilters = {},
): Promise<ListCallsResult<CallDashboardRow>> {
  const operation = "listDashboardCalls";
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;
  const sortBy = filters.sortBy ?? "created_at";
  const sortOrder = filters.sortOrder ?? "desc";
  const searchTerm = filters.search ?? filters.customer;

  try {
    const supabase = getClient();

    let query = supabase
      .from(VIEW)
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (searchTerm) {
      const escaped = searchTerm.replace(/[%_]/g, "\\$&");
      query = query.or(
        `customer_name.ilike.%${escaped}%,phone_number.ilike.%${escaped}%`,
      );
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw wrapServiceError(error, operation, VIEW);
    }

    return {
      data: (data ?? []).map(mapDashboardRowToModel),
      total: count ?? 0,
      page,
      limit,
    };
  } catch (error) {
    throw wrapServiceError(error, operation, VIEW);
  }
}

export async function getDashboardCallById(
  id: string,
): Promise<CallDashboardRow | null> {
  const operation = "getDashboardCallById";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(VIEW)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw wrapServiceError(error, operation, VIEW);
    }

    return data ? mapDashboardRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, VIEW);
  }
}

export async function getDashboardCallByCallId(
  callId: string,
): Promise<CallDashboardRow | null> {
  const operation = "getDashboardCallByCallId";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(VIEW)
      .select("*")
      .eq("call_id", callId)
      .maybeSingle();

    if (error) {
      throw wrapServiceError(error, operation, VIEW);
    }

    return data ? mapDashboardRowToModel(data) : null;
  } catch (error) {
    throw wrapServiceError(error, operation, VIEW);
  }
}

export async function updateCallById(
  id: string,
  input: UpdateCallRow,
): Promise<CallRecord> {
  const operation = "updateCallById";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        ...input,
        updated_at: input.updated_at ?? new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    if (!data) {
      throw new SupabaseServiceError("Call not found", {
        code: "NOT_FOUND",
        operation,
        table: TABLE,
      });
    }

    return mapCallRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function updateCallByCallId(
  callId: string,
  input: UpdateCallRow,
): Promise<CallRecord> {
  const operation = "updateCallByCallId";

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        ...input,
        updated_at: input.updated_at ?? new Date().toISOString(),
      })
      .eq("call_id", callId)
      .select()
      .single();

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }

    if (!data) {
      throw new SupabaseServiceError(`Call not found: ${callId}`, {
        code: "NOT_FOUND",
        operation,
        table: TABLE,
      });
    }

    return mapCallRowToModel(data);
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function deleteCallById(id: string): Promise<void> {
  const operation = "deleteCallById";

  try {
    const supabase = getClient();

    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function deleteCallByCallId(callId: string): Promise<void> {
  const operation = "deleteCallByCallId";

  try {
    const supabase = getClient();

    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("call_id", callId);

    if (error) {
      throw wrapServiceError(error, operation, TABLE);
    }
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}

export async function countCallsByStatus(): Promise<{
  total: number;
  completed: number;
  active: number;
  failed: number;
}> {
  const operation = "countCallsByStatus";

  try {
    const supabase = getClient();

    const { count: total, error: totalError } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true });

    if (totalError) {
      throw wrapServiceError(totalError, operation, TABLE);
    }

    const { count: completed, error: completedError } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    if (completedError) {
      throw wrapServiceError(completedError, operation, TABLE);
    }

    const activeStatuses: CallStatus[] = [
      "initiated",
      "ringing",
      "in-progress",
    ];

    const { count: active, error: activeError } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .in("status", activeStatuses);

    if (activeError) {
      throw wrapServiceError(activeError, operation, TABLE);
    }

    const { count: failed, error: failedError } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    if (failedError) {
      throw wrapServiceError(failedError, operation, TABLE);
    }

    return {
      total: total ?? 0,
      completed: completed ?? 0,
      active: active ?? 0,
      failed: failed ?? 0,
    };
  } catch (error) {
    throw wrapServiceError(error, operation, TABLE);
  }
}
