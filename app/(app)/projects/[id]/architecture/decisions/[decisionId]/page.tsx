import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureDecisionStatusBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureDecision } from "@/lib/architecture/decisions/queries";

import { ArchitectureDecisionActions } from "./decision-actions";

export default async function ArchitectureDecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string; decisionId: string }>;
}) {
  const { id, decisionId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const decision = await getArchitectureDecision(decisionId);
  if (!decision || decision.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture/decisions`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to decisions
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {decision.title}
            </h1>
            <div className="mt-1">
              <ArchitectureDecisionStatusBadge status={decision.status} />
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(decision.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink
              href={`/projects/${project.id}/architecture/decisions/${decision.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <ArchitectureDecisionActions
              projectId={project.id}
              decisionId={decision.id}
            />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field label="Context" value={decision.context} />
        <Field label="Decision" value={decision.decision} />
        <Field label="Rationale" value={decision.rationale} />
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="card-glass">
      <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6">
        {value?.trim() ? value : <span className="italic text-[var(--muted-foreground)]">—</span>}
      </p>
    </div>
  );
}
