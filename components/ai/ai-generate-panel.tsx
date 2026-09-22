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
  const [autoPrompt, setAutoPrompt] = useState<string | undefined>(undefined);
  const labels = AI_STAGE_LABELS[stage];

  const openManually = () => {
    setAutoPrompt(undefined);
    setOpen(true);
  };

  const openAuto = () => {
    setAutoPrompt(labels.autoPrompt);
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={openManually}
        aria-label={`Open AI generate ${labels.plural} drawer`}
      >
        <span aria-hidden="true">✨</span>
        <span>Generate with AI</span>
      </Button>

      <Button
        variant="primary"
        size="sm"
        onClick={openAuto}
        aria-label={`Auto generate ${labels.plural} from existing data`}
      >
        <span aria-hidden="true">⚡</span>
        <span>Auto AI generate</span>
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
            key={autoPrompt ?? "manual"}
            projectId={projectId}
            stage={stage}
            credential={credential}
            autoPrompt={autoPrompt}
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
