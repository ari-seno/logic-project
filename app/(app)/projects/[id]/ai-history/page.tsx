import Link from "next/link";
import { notFound } from "next/navigation";
import { History } from "lucide-react";

import { DataCell, DataList, DataRow } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { AI_STAGE_LABELS } from "@/components/ai/stage-labels";
import { formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { isAiStage, stageRevalidatePath } from "@/lib/ai/stages";
import { listProjectAiSuggestions } from "@/lib/ai/suggestions";
import type { Json } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function itemCount(payload: Json, stage: string): number {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return 0;
  }
  const value = (payload as Record<string, unknown>)[stage];
  return Array.isArray(value) ? value.length : 0;
}

export default async function AiHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const suggestions = await listProjectAiSuggestions(project.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <ButtonLink
          href={`/projects/${project.id}`}
          variant="ghost"
          size="sm"
          className="w-fit px-0"
        >
          ← Back to project
        </ButtonLink>
        <h1 className="text-2xl font-semibold tracking-tight">AI history</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {project.name} · {suggestions.length} generation
          {suggestions.length === 1 ? "" : "s"} · Review past suggestions and
          re-run a stage when the project has moved on.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          title="No AI generations yet"
          description="Use Generate with AI on any section to create a first draft. Every generation is recorded here."
          icon={<History className="h-6 w-6" />}
        />
      ) : (
        <DataList
          caption="Past AI generations"
          columns={[
            { key: "stage", label: "Stage" },
            { key: "status", label: "Status" },
            { key: "items", label: "Items", align: "right" },
            { key: "model", label: "Model" },
            { key: "created", label: "Created" },
            { key: "actions", label: "", align: "right" },
          ]}
        >
          {suggestions.map((suggestion) => {
            const stage = isAiStage(suggestion.stage) ? suggestion.stage : null;
            const count = itemCount(suggestion.payload, suggestion.stage);
            const href = stage ? stageRevalidatePath(stage, project.id) : null;

            return (
              <DataRow key={suggestion.id} interactive>
                <DataCell>
                  {stage ? (
                    <span className="inline-flex items-center rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--brand)]">
                      {AI_STAGE_LABELS[stage].plural}
                    </span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">
                      {suggestion.stage}
                    </span>
                  )}
                </DataCell>
                <DataCell>
                  <SuggestionStatusBadge status={suggestion.status} />
                </DataCell>
                <DataCell align="right" mono>
                  {count}
                </DataCell>
                <DataCell>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {suggestion.provider} · {suggestion.model}
                  </span>
                </DataCell>
                <DataCell>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDateTime(suggestion.created_at)}
                  </span>
                </DataCell>
                <DataCell align="right">
                  {href ? (
                    <Link
                      href={href}
                      className="font-medium text-[var(--brand)] hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                </DataCell>
              </DataRow>
            );
          })}
        </DataList>
      )}
    </div>
  );
}

function SuggestionStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
    applied:
      "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
    rejected:
      "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  };
  const className =
    classes[status] ??
    "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${className}`}
    >
      {status}
    </span>
  );
}
