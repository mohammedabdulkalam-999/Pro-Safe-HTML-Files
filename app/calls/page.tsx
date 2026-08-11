import { CallsPageContent } from "@/components/calls/calls-page-content";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export default function CallsPage() {
  return (
    <PageContainer>
      <div className="admin-shell">
        <div className="border-b border-brand-border/40 p-4 md:p-5">
          <PageHeader
            title="Calls"
            description="Review all outbound AI sales calls and their outcomes."
          />
        </div>
        <div className="p-4 md:p-5">
          <div className="admin-content-card">
            <CallsPageContent />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
