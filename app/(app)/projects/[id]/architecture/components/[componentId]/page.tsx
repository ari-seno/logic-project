import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureComponentTypeBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { CreateTaskFromArtifactButton } from "@/components/ui/tasks/create-task-from-artifact-button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureComponent } from "@/lib/architecture/components/queries";

import { ArchitectureComponentActions } from "./component-actions";

export default async function ArchitectureComponentDetailPage({
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
          href={`/projects/${project.id}/architecture/components`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to components
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {component.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <ArchitectureComponentTypeBadge type={component.type} />
            </div>
            {component.description ? (
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
                {component.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(component.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <CreateTaskFromArtifactButton
              kind="component"
              refId={component.id}
              projectId={project.id}
            >
              Create task
            </CreateTaskFromArtifactButton>
            <ButtonLink
              href={`/projects/${project.id}/architecture/components/${component.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <ArchitectureComponentActions
              projectId={project.id}
              componentId={component.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
