import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { UiComponentForm } from "@/components/ui/screens/component-form";
import { getProject } from "@/lib/projects/queries";
import { getUiComponent } from "@/lib/ui/components/queries";

export default async function EditUiComponentPage({
  params,
}: {
  params: Promise<{ id: string; componentId: string }>;
}) {
  const { id, componentId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const component = await getUiComponent(componentId);
  if (!component || component.project_id !== project.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="ui" />

      <div>
        <Link
          href={`/projects/${project.id}/ui`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to UI
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit component
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <UiComponentForm projectId={project.id} component={component} />
      </div>
    </div>
  );
}
