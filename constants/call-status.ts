export const CALL_STATUSES = [
  "initiated",
  "ringing",
  "in-progress",
  "completed",
  "failed",
  "busy",
  "no-answer",
  "voicemail",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export const AI_AGENT_STATUSES = ["idle", "listening", "talking"] as const;
export type AiAgentStatus = (typeof AI_AGENT_STATUSES)[number];

export type StatusBadgeVariant = CallStatus | "calling" | AiAgentStatus;

/** Maps a call status to the badge variant used in the UI. */
export function toStatusBadgeVariant(status: CallStatus): StatusBadgeVariant {
  if (status === "in-progress" || status === "ringing") {
    return "calling";
  }
  return status;
}

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  initiated: "Initiated",
  ringing: "Ringing",
  "in-progress": "In Progress",
  completed: "Completed",
  failed: "Failed",
  busy: "Busy",
  "no-answer": "No Answer",
  voicemail: "Voicemail",
};

/** UI-facing status groups for badges (wireframe spec) */
export const ACTIVE_CALL_STATUSES: CallStatus[] = [
  "initiated",
  "ringing",
  "in-progress",
];
