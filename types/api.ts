import type { CallStatus } from "@/constants/call-status";
import type { CallListItem } from "@/types/call";

export interface CallsListResponse {
  items: CallListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponseBody {
  success: false;
  message: string;
  errorCode?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponseBody;

export interface StartCallResponse {
  callId: string;
  status: CallStatus;
  id: string;
}

export interface DashboardStats {
  totalCalls: number;
  completedCalls: number;
  activeCalls: number;
  failedCalls: number;
  qualifiedLeads?: number;
  successRate?: number;
}

export interface HealthCheckResponse {
  status: "UP" | "DOWN";
  checks?: {
    supabase: "UP" | "DOWN";
    vapi: "UP" | "DOWN";
  };
}

export interface DeleteCallResponse {
  success: boolean;
}
