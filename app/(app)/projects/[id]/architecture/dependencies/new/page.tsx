import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureComponentDependencyForm } from "@/components/architecture/dependency-form";
import { getProject } from "@/lib/projects/queries";
import { listArchitectureComponentsByProject } from "@/lib/architecture/components/queries";

export default async function NewArchitectureComponentDependencyPage({
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New component dependency
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      {components.length < 2 ? (
        <div className="card-glass text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            You need at least two components in this project to create a
            dependency.
          </p>
        </div>
      ) : (
        <div className="card-glass">
          <ArchitectureComponentDependencyForm
            projectId={project.id}
            components={components}
          />
        </div>
      )}
    </div>
  );
}
