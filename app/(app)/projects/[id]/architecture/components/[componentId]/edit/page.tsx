import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureComponentForm } from "@/components/architecture/component-form";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureComponent } from "@/lib/architecture/components/queries";

export default async function EditArchitectureComponentPage({
  params,
}: {
  params: Promise<{ id: string; componentId: string }>;
}) {
  const { id, componentId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const component = await getArchitectureComponent(componentId);
  if (!component || component.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture/components/${component.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to component
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit component
        </h1>
      </div>

      <div className="card-glass">
        <ArchitectureComponentForm
          projectId={project.id}
          component={component}
        />
      </div>
    </div>
  );
}
