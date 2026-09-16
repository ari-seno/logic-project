import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureComponentTypeBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listArchitectureComponentsByProject } from "@/lib/architecture/components/queries";

export default async function ArchitectureComponentsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const components = await listArchitectureComponentsByProject({
    projectId: project.id,
  });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to architecture
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink href={`/projects/${project.id}/architecture/components/new`}>
            New component
          </ButtonLink>
        </div>
      </div>

      {components.length === 0 ? (
        <div className="card-glass text-center">
          <h2 className="text-lg font-semibold">No components yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Capture the moving parts of your system.
          </p>
          <div className="mt-4">
            <ButtonLink href={`/projects/${project.id}/architecture/components/new`}>
              Add Component
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {components.map((c) => (
            <li key={c.id} className="card-glass">
              <Link
                href={`/projects/${project.id}/architecture/components/${c.id}`}
                className="flex flex-col gap-2 hover:underline"
              >
                <span className="text-base font-semibold">{c.name}</span>
                <ArchitectureComponentTypeBadge type={c.type} />
                {c.description ? (
                  <p className="line-clamp-3 text-sm text-[var(--muted-foreground)]">
                    {c.description}
                  </p>
                ) : (
                  <p className="italic text-sm text-[var(--muted-foreground)]">
                    No description
                  </p>
                )}
                <span className="text-xs text-[var(--muted-foreground)]">
                  Updated {formatDate(c.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
