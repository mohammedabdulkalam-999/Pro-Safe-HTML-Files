import type { CallStatus } from "@/constants/call-status";

/** Incoming POST /api/calls body (validated by Zod). */
export interface CreateCallRequestDto {
  customerName: string;
  phoneNumber: string;
}

/** Outgoing POST /api/calls response payload. */
export interface CreateCallResponseDto {
  /** Vapi external call identifier (stored as calls.call_id). */
  callId: string;
  status: CallStatus;
  /** Supabase row UUID — used for in-app routing (/calls/[id]). */
  id: string;
}
