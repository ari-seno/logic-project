"use client";

import { ButtonLink } from "@/components/ui/button";

export type SetupRequiredCtaProps = {
  projectId: string;
};

export function SetupRequiredCta({ projectId }: SetupRequiredCtaProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-5 text-sm">
      <p className="font-medium text-[var(--foreground)]">
        Pick an AI credential for this project.
      </p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Add an Ollama credential in Settings, then choose it for this project
        before generating requirements.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <ButtonLink href={`/projects/${projectId}`} variant="primary" size="sm">
          Choose credential
        </ButtonLink>
        <ButtonLink href="/account/settings" variant="ghost" size="sm">
          Open AI settings
        </ButtonLink>
      </div>
    </div>
  );
}
