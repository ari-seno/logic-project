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
import { countDomains } from "@/lib/domains/queries";
import { countEntitiesByProject } from "@/lib/entities/queries";
import { countRelationshipsByProject } from "@/lib/relationships/queries";
import { countArchitectureComponentsByProject } from "@/lib/architecture/components/queries";
import { countArchitectureTechnologiesByProject } from "@/lib/architecture/technologies/queries";
import { countArchitectureDecisionsByProject } from "@/lib/architecture/decisions/queries";
import { countArchitectureComponentDependenciesByProject } from "@/lib/architecture/dependencies/queries";
import { countApiGroupsByProject } from "@/lib/api/groups/queries";
import { countApiEndpointsByProject } from "@/lib/api/endpoints/queries";

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

  const [
    requirementCount,
    decisionCount,
    domainCount,
    entityCount,
    relationshipCount,
    componentCount,
    technologyCount,
    archDecisionCount,
    dependencyCount,
    apiGroupCount,
    apiEndpointCount,
    recentRequirements,
    recentDecisions,
  ] = await Promise.all([
    countRequirements(project.id),
    countDecisions(project.id),
    countDomains(project.id),
    countEntitiesByProject(project.id),
    countRelationshipsByProject(project.id),
    countArchitectureComponentsByProject(project.id),
    countArchitectureTechnologiesByProject(project.id),
    countArchitectureDecisionsByProject(project.id),
    countArchitectureComponentDependenciesByProject(project.id),
    countApiGroupsByProject(project.id),
    countApiEndpointsByProject(project.id),
    listRequirements({ projectId: project.id, limit: 5 }),
    listDecisions({ projectId: project.id, limit: 5 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/projects"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to projects
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Created {formatDateTime(project.created_at)}</span>
              <span>Updated {formatDateTime(project.updated_at)}</span>
            </div>
          </div>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
        <div className="mt-4">
          <ProjectTabs projectId={project.id} active="overview" />
        </div>
      </div>

      <section className="card-glass p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Description
        </h2>
        {project.description ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
            {project.description}
          </p>
        ) : (
          <p className="mt-3 italic text-sm text-[var(--muted-foreground)]">
            No description yet.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Project Context
        </h2>
        <div className="mt-3 card-glass p-6">
          <div className="grid grid-cols-2 gap-4 sm:max-w-2xl sm:grid-cols-5">
            <Stat label="Requirements" value={requirementCount} />
            <Stat label="Decisions" value={decisionCount} />
            <Stat label="Domains" value={domainCount} />
            <Stat label="Entities" value={entityCount} />
            <Stat label="Relationships" value={relationshipCount} />
            <Stat label="Components" value={componentCount} />
            <Stat label="Technologies" value={technologyCount} />
            <Stat label="Arch decisions" value={archDecisionCount} />
            <Stat label="Dependencies" value={dependencyCount} />
            <Stat label="API groups" value={apiGroupCount} />
            <Stat label="API endpoints" value={apiEndpointCount} />
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
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
            <div className="card-glass p-8 text-center">
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
                  className="card-glass p-4 transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/projects/${project.id}/requirements/${req.id}`}
                    className="flex flex-col gap-2"
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
            <div className="card-glass p-8 text-center">
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
                  className="card-glass p-4 transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/projects/${project.id}/decisions/${dec.id}`}
                    className="flex flex-col gap-2"
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
