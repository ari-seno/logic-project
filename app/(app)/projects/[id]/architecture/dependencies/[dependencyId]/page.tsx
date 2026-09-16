import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureComponent } from "@/lib/architecture/components/queries";
import { getArchitectureComponentDependency } from "@/lib/architecture/dependencies/queries";

import { ArchitectureComponentDependencyActions } from "./dependency-actions";

export default async function ArchitectureComponentDependencyDetailPage({
  params,
}: {
  params: Promise<{ id: string; dependencyId: string }>;
}) {
  const { id, dependencyId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const dep = await getArchitectureComponentDependency(dependencyId);
  if (!dep || dep.project_id !== project.id) {
    notFound();
  }

  const [source, target] = await Promise.all([
    getArchitectureComponent(dep.source_component_id),
    getArchitectureComponent(dep.target_component_id),
  ]);

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
            <h1 className="text-2xl font-semibold tracking-tight">
              {source?.name ?? "(missing)"} → {target?.name ?? "(missing)"}
            </h1>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Created {formatDate(dep.created_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink
              href={`/projects/${project.id}/architecture/dependencies/${dep.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <ArchitectureComponentDependencyActions
              projectId={project.id}
              dependencyId={dep.id}
            />
          </div>
        </div>
      </div>

      {dep.description ? (
        <section className="card-glass">
          <p className="whitespace-pre-line text-sm leading-6">
            {dep.description}
          </p>
        </section>
      ) : null}
    </div>
  );
}
