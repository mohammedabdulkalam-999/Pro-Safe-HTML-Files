import { apiSuccess, handleApiError } from "@/lib/api-response";
import { countCallsByStatus, countQualifiedLeads } from "@/services/supabase";
import type { DashboardStats } from "@/types/api";

export async function GET() {
  try {
    const counts = await countCallsByStatus();
    const qualifiedLeads = await countQualifiedLeads();

    const successRate =
      counts.total > 0
        ? Math.round((counts.completed / counts.total) * 100)
        : 0;

    const stats: DashboardStats = {
      totalCalls: counts.total,
      completedCalls: counts.completed,
      activeCalls: counts.active,
      failedCalls: counts.failed,
      qualifiedLeads,
      successRate,
    };

    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
