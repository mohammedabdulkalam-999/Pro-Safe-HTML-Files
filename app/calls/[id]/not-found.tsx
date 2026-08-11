import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function CallNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Call Not Found</h1>
      <p className="text-muted-foreground">
        The call you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href={ROUTES.DASHBOARD}>Back to Dashboard</Link>
      </Button>
    </div>
  );
}
