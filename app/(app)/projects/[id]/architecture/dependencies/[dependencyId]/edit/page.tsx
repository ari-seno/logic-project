import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureComponentDependencyForm } from "@/components/architecture/dependency-form";
import { getProject } from "@/lib/projects/queries";
import { listArchitectureComponentsByProject } from "@/lib/architecture/components/queries";
import { getArchitectureComponentDependency } from "@/lib/architecture/dependencies/queries";

export default async function EditArchitectureComponentDependencyPage({
  params,
}: {
  params: Promise<{ id: string; dependencyId: string }>;
}) {
  const { id, dependencyId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const dependency = await getArchitectureComponentDependency(dependencyId);
  if (!dependency || dependency.project_id !== project.id) {
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
          href={`/projects/${project.id}/architecture/dependencies/${dependency.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to dependency
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit dependency
        </h1>
      </div>

      <div className="card-glass">
        <ArchitectureComponentDependencyForm
          projectId={project.id}
          components={components}
          dependency={dependency}
        />
      </div>
    </div>
  );
}
