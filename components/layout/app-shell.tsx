import { AppFooter } from "@/components/layout/app-footer";
import { TopNav } from "@/components/layout/top-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
