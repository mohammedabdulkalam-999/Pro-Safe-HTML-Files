import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function NotFoundPage() {
  return (
    <div className="admin-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="admin-shell w-full max-w-lg p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you requested does not exist or has been moved.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href={ROUTES.DASHBOARD}>Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
