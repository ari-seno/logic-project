import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  ArchitectureComponentTypeBadge,
  ArchitectureDecisionStatusBadge,
  ArchitectureTechnologyCategoryBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  listArchitectureComponentsByProject,
} from "@/lib/architecture/components/queries";
import {
  listArchitectureTechnologiesByProject,
} from "@/lib/architecture/technologies/queries";
import {
  listArchitectureDecisionsByProject,
} from "@/lib/architecture/decisions/queries";
import {
  listArchitectureComponentDependenciesByProject,
} from "@/lib/architecture/dependencies/queries";
import {
  buildArchitectureMermaid,
  type ArchitectureComponent,
  type ArchitectureDependency,
} from "@/lib/diagrams/mermaid";

export default async function ArchitectureOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const [components, technologies, decisions, dependencies] = await Promise.all([
    listArchitectureComponentsByProject({ projectId: project.id }),
    listArchitectureTechnologiesByProject({ projectId: project.id }),
    listArchitectureDecisionsByProject({ projectId: project.id, limit: 5 }),
    listArchitectureComponentDependenciesByProject({ projectId: project.id }),
  ]);

  const componentById = new Map(components.map((c) => [c.id, c]));

  const diagramComponents: ArchitectureComponent[] = components.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));
  const diagramDependencies: ArchitectureDependency[] = dependencies.map(
    (d) => ({
      id: d.id,
      source_component_id: d.source_component_id,
      target_component_id: d.target_component_id,
    }),
  );
  const diagramChart = buildArchitectureMermaid(
    diagramComponents,
    diagramDependencies,
  );

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Architecture
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <section className="card-glass">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Components</h2>
          <ButtonLink
            href={`/projects/${project.id}/architecture/components/new`}
            size="sm"
          >
            New component
          </ButtonLink>
        </header>
        {diagramChart ? (
          <div className="mb-4">
            <MermaidDiagram
              chart={diagramChart}
              ariaLabel="Architecture component dependency diagram"
            />
          </div>
        ) : null}
        {components.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No components yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {components.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-[var(--border)] bg-white/70 p-3"
              >
                <Link
                  href={`/projects/${project.id}/architecture/components/${c.id}`}
                  className="flex flex-col gap-1 hover:underline"
                >
                  <span className="font-medium">{c.name}</span>
                  <ArchitectureComponentTypeBadge type={c.type} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Technologies</h2>
          <ButtonLink
            href={`/projects/${project.id}/architecture/technologies/new`}
            size="sm"
          >
            New technology
          </ButtonLink>
        </header>
        {technologies.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No technologies yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {technologies.slice(0, 8).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm"
              >
                <Link
                  href={`/projects/${project.id}/architecture/technologies/${t.id}`}
                  className="font-medium hover:underline"
                >
                  {t.name}
                </Link>
                <ArchitectureTechnologyCategoryBadge category={t.category} />
              </li>
            ))}
            {technologies.length > 8 ? (
              <li>
                <Link
                  href={`/projects/${project.id}/architecture/technologies`}
                  className="text-xs text-[var(--brand)] hover:underline"
                >
                  View all {technologies.length}
                </Link>
              </li>
            ) : null}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recent decisions</h2>
          <ButtonLink
            href={`/projects/${project.id}/architecture/decisions/new`}
            size="sm"
          >
            New decision
          </ButtonLink>
        </header>
        {decisions.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No architecture decisions yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {decisions.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm"
              >
                <Link
                  href={`/projects/${project.id}/architecture/decisions/${d.id}`}
                  className="font-medium hover:underline"
                >
                  {d.title}
                </Link>
                <ArchitectureDecisionStatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Dependencies</h2>
          {components.length >= 2 ? (
            <ButtonLink
              href={`/projects/${project.id}/architecture/dependencies/new`}
              size="sm"
            >
              New dependency
            </ButtonLink>
          ) : null}
        </header>
        {dependencies.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No dependencies yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dependencies.map((dep) => {
              const source = componentById.get(dep.source_component_id);
              const target = componentById.get(dep.target_component_id);
              return (
                <li
                  key={dep.id}
                  className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm"
                >
                  <Link
                    href={`/projects/${project.id}/architecture/dependencies/${dep.id}`}
                    className="font-medium hover:underline"
                  >
                    {source?.name ?? "(?)"} → {target?.name ?? "(?)"}
                  </Link>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(dep.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
