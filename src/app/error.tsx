"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center gap-6">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <svg
          className="h-7 w-7 text-red"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
        <p className="text-sm text-muted leading-relaxed">
          An unexpected error occurred. You can try again or head back to the
          dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="blue" onClick={reset}>
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
