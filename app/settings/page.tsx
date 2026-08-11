import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className="admin-shell p-6">
        <PageHeader
          title="Settings"
          description="Settings are disabled for the MVP demo."
        />
        <p className="text-sm text-muted-foreground">
          Authentication, user management, and configuration will be available in
          a future release.
        </p>
      </div>
    </PageContainer>
  );
}
