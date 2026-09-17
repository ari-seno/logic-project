import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  PriorityBadge,
  RequirementStatusBadge,
  TypeBadge,
} from "@/components/projects/badges";
import { AiPromptInput } from "@/components/ai/ai-prompt-input";
import { SetupRequiredCta } from "@/components/ai/setup-required-cta";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listRequirements } from "@/lib/requirements/queries";
import { getProjectCredentialAction } from "@/lib/ai/credentials-actions";

export default async function RequirementsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const requirements = await listRequirements({ projectId: project.id });
  const credentialResult = await getProjectCredentialAction(project.id);
  const credential =
    credentialResult.ok && credentialResult.credential
      ? credentialResult.credential
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to overview
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Requirements
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink href={`/projects/${project.id}/requirements/new`}>
            New requirement
          </ButtonLink>
        </div>
        <div className="mt-4">
          <ProjectTabs projectId={project.id} active="requirements" />
        </div>
      </div>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          AI assist
        </h2>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Generate a first draft of requirements from a prompt.
        </p>
        <div className="mt-3">
          {credential ? (
            <AiPromptInput projectId={project.id} credential={credential} />
          ) : (
            <SetupRequiredCta projectId={project.id} />
          )}
        </div>
      </section>

      {requirements.length === 0 ? (
        <EmptyState
          icon={
            <EmptyStateIcon>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </EmptyStateIcon>
          }
          title="No requirements yet"
          description="Define what this project needs to accomplish. Requirements guide every downstream decision."
          action={
            <ButtonLink href={`/projects/${project.id}/requirements/new`}>
              Add requirement
            </ButtonLink>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requirements.map((req) => (
            <li
              key={req.id}
              className="card-glass p-5 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/projects/${project.id}/requirements/${req.id}`}
                className="flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-base font-semibold tracking-tight">
                    {req.title}
                  </span>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <TypeBadge type={req.type} />
                    <RequirementStatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                  </div>
                </div>
                {req.description ? (
                  <p className="line-clamp-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {req.description}
                  </p>
                ) : (
                  <p className="italic text-sm text-[var(--muted-foreground)]">
                    No description
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 text-xs text-[var(--muted-foreground)]">
                  <span>Created {formatDate(req.created_at)}</span>
                  <span>Updated {formatDate(req.updated_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
