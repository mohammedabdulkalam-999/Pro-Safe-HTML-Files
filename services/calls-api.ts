import { API_ROUTES } from "@/constants/api";
import { apiClient, ApiClientError } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CallsListResponse,
  DashboardStats,
  StartCallResponse,
} from "@/types/api";
import type { CallDetail, CallListItem } from "@/types/call";
import type { StartCallFormInput } from "@/validators/call";
import type { CallsListQueryParams } from "@/validators/calls-list";

function buildCallsQueryString(query: CallsListQueryParams = {}): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function fetchCalls(
  query: CallsListQueryParams = {},
): Promise<CallsListResponse> {
  const response = await apiClient<
    ApiSuccessResponse<CallsListResponse>
  >(`${API_ROUTES.CALLS}${buildCallsQueryString(query)}`);

  return response.data;
}

export async function fetchCallById(id: string): Promise<CallDetail> {
  const response = await apiClient<ApiSuccessResponse<CallDetail>>(
    API_ROUTES.CALL_BY_ID(id),
  );
  return response.data;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient<ApiSuccessResponse<DashboardStats>>(
    API_ROUTES.DASHBOARD,
  );
  return response.data;
}

export type CreateCallResult = StartCallResponse;

export async function createCall(
  input: StartCallFormInput,
): Promise<CreateCallResult> {
  const response = await apiClient<ApiSuccessResponse<CreateCallResult>>(
    API_ROUTES.CALLS,
    { method: "POST", body: input },
  );
  return response.data;
}

export async function deleteCall(id: string): Promise<void> {
  await apiClient(API_ROUTES.CALL_BY_ID(id), { method: "DELETE" });
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
