"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Project route failed:", error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card-glass p-6">
        <h1 className="text-lg font-semibold tracking-tight">
          This project could not be loaded
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Something went wrong while loading the project. Your saved work is
          unaffected. Try again, or return to the projects list.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" type="button" onClick={() => history.back()}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
