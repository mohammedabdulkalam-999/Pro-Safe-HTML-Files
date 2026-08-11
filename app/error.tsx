"use client";

import Link from "next/link";
import { useEffect } from "react";

import { RetryState } from "@/components/shared/retry-state";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="admin-page flex min-h-[60vh] items-center justify-center">
      <div className="admin-shell w-full max-w-lg p-6">
        <RetryState
          title="Something went wrong"
          description="An unexpected error occurred while loading this page."
          onRetry={reset}
        />
        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link href={ROUTES.DASHBOARD}>Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
