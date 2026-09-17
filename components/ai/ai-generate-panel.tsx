"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AiDrawer } from "@/components/ai/ai-drawer";
import { SetupRequiredCta } from "@/components/ai/setup-required-cta";
import { AiGenerateContent } from "@/components/ai/ai-generate-content";

export type AiGeneratePanelProps = {
  projectId: string;
  credential: {
    id: string;
    label: string;
    model: string;
    last_test_status: string | null;
  } | null;
};

export function AiGeneratePanel({
  projectId,
  credential,
}: AiGeneratePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open AI generate requirements drawer"
      >
        <span aria-hidden="true">✨</span>
        <span>Generate with AI</span>
      </Button>

      <AiDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Generate requirements"
        subtitle={
          credential
            ? `Powered by ${credential.label} · ${credential.model}`
            : "AI assist for first-draft requirements"
        }
      >
        {credential ? (
          <AiGenerateContent
            projectId={projectId}
            credential={credential}
            onApplied={() => setOpen(false)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SetupRequiredCta projectId={projectId} />
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
