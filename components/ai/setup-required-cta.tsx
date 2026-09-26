"use client";

import { ButtonLink } from "@/components/ui/button";
import { AI_STAGE_LABELS } from "@/components/ai/stage-labels";
import type { AiStage } from "@/lib/ai/stages";

export type SetupRequiredCtaProps = {
  projectId: string;
  stage: AiStage;
};

export function SetupRequiredCta({ projectId, stage }: SetupRequiredCtaProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/60 p-5 text-sm">
      <p className="font-medium text-[var(--foreground)]">
        Pick an AI credential for this project.
      </p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {AI_STAGE_LABELS[stage].setupCopy}
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
