import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { UiNavigationItemForm } from "@/components/ui/screens/navigation-form";
import { getProject } from "@/lib/projects/queries";
import { listUiNavigationItemsByProject } from "@/lib/ui/navigation/queries";

export default async function NewUiNavigationItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const items = await listUiNavigationItemsByProject({ projectId: project.id });

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
          New navigation item
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <UiNavigationItemForm
          projectId={project.id}
          availableParents={items}
        />
      </div>
    </div>
  );
}
