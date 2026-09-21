"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AiDrawer } from "@/components/ai/ai-drawer";
import { SetupRequiredCta } from "@/components/ai/setup-required-cta";
import { AiGenerateContent } from "@/components/ai/ai-generate-content";
import { AI_STAGE_LABELS } from "@/components/ai/stage-labels";
import type { AiStage } from "@/lib/ai/stages";

export type AiGeneratePanelProps = {
  projectId: string;
  stage: AiStage;
  credential: {
    id: string;
    label: string;
    model: string;
    last_test_status: string | null;
  } | null;
};

export function AiGeneratePanel({
  projectId,
  stage,
  credential,
}: AiGeneratePanelProps) {
  const [open, setOpen] = useState(false);
  const labels = AI_STAGE_LABELS[stage];

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Open AI generate ${labels.plural} drawer`}
      >
        <span aria-hidden="true">✨</span>
        <span>Generate with AI</span>
      </Button>

      <AiDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={labels.drawerTitle}
        subtitle={
          credential
            ? `Powered by ${credential.label} · ${credential.model}`
            : labels.subtitleFallback
        }
      >
        {credential ? (
          <AiGenerateContent
            projectId={projectId}
            stage={stage}
            credential={credential}
            onApplied={() => setOpen(false)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SetupRequiredCta projectId={projectId} stage={stage} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="self-start text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              ← Close
            </button>
          </div>
        )}
      </AiDrawer>
    </>
  );
}
