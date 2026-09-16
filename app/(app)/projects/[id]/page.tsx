import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  DecisionStatusBadge,
  PriorityBadge,
  RequirementStatusBadge,
  TypeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  countRequirements,
  listRequirements,
} from "@/lib/requirements/queries";
import {
  countDecisions,
  listDecisions,
} from "@/lib/decisions/queries";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const [requirementCount, decisionCount, recentRequirements, recentDecisions] =
    await Promise.all([
      countRequirements(project.id),
      countDecisions(project.id),
      listRequirements({ projectId: project.id, limit: 5 }),
      listDecisions({ projectId: project.id, limit: 5 }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="overview" />

      <div>
        <Link
          href="/projects"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Created {formatDateTime(project.created_at)}</span>
              <span>Updated {formatDateTime(project.updated_at)}</span>
            </div>
          </div>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Description
        </h2>
        {project.description ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {project.description}
          </p>
        ) : (
          <p className="mt-2 italic text-sm text-[var(--muted-foreground)]">
            No description yet.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Project Context
        </h2>
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-white p-6">
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Requirements
              </p>
              <p className="mt-1 text-2xl font-semibold">{requirementCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Decisions
              </p>
              <p className="mt-1 text-2xl font-semibold">{decisionCount}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
            <p>
              Last updated:{" "}
              <span className="text-[var(--foreground)]">
                {formatDate(project.updated_at)}
              </span>
            </p>
            <p className="mt-1 italic">
              AI-assisted context generation is planned for a later part.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <header className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Recent Requirements
            </h2>
            <Link
              href={`/projects/${project.id}/requirements`}
              className="text-xs font-medium text-[var(--brand)] hover:underline"
            >
              View all
            </Link>
          </header>
          {recentRequirements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No requirements yet.
              </p>
              <div className="mt-3">
                <ButtonLink
                  href={`/projects/${project.id}/requirements/new`}
                  size="sm"
                >
                  Add Requirement
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentRequirements.map((req) => (
                <li
                  key={req.id}
                  className="rounded-lg border border-[var(--border)] bg-white p-4"
                >
                  <Link
                    href={`/projects/${project.id}/requirements/${req.id}`}
                    className="flex flex-col gap-2 hover:underline"
                  >
                    <span className="font-medium">{req.title}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <TypeBadge type={req.type} />
                      <RequirementStatusBadge status={req.status} />
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Updated {formatDate(req.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <header className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Recent Decisions
            </h2>
            <Link
              href={`/projects/${project.id}/decisions`}
              className="text-xs font-medium text-[var(--brand)] hover:underline"
            >
              View all
            </Link>
          </header>
          {recentDecisions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No decisions yet.
              </p>
              <div className="mt-3">
                <ButtonLink
                  href={`/projects/${project.id}/decisions/new`}
                  size="sm"
                >
                  Add Decision
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentDecisions.map((dec) => (
                <li
                  key={dec.id}
                  className="rounded-lg border border-[var(--border)] bg-white p-4"
                >
                  <Link
                    href={`/projects/${project.id}/decisions/${dec.id}`}
                    className="flex flex-col gap-2 hover:underline"
                  >
                    <span className="font-medium">{dec.title}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <DecisionStatusBadge status={dec.status} />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Updated {formatDate(dec.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
