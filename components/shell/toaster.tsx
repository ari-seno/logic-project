"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={(theme as "light" | "dark" | "system" | undefined) ?? "system"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--border)] bg-[var(--surface-1)] text-[var(--foreground)] shadow-[var(--shadow-3)]",
          description: "text-[var(--muted-foreground)]",
          actionButton: "bg-[var(--brand)] text-[var(--brand-foreground)]",
          cancelButton: "bg-[var(--muted)] text-[var(--foreground)]",
        },
      }}
    />
  );
}
