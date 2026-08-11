import { PageContainer } from "@/components/layout/page-container";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return (
    <PageContainer>
      <div className="admin-shell">
        <DashboardContent />
      </div>
    </PageContainer>
  );
}
