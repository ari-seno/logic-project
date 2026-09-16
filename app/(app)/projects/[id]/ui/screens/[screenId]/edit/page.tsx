import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { UiScreenForm } from "@/components/ui/screens/screen-form";
import { getProject } from "@/lib/projects/queries";
import { getUiScreen } from "@/lib/ui/screens/queries";

export default async function EditUiScreenPage({
  params,
}: {
  params: Promise<{ id: string; screenId: string }>;
}) {
  const { id, screenId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const screen = await getUiScreen(screenId);
  if (!screen || screen.project_id !== project.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="ui" />

      <div>
        <Link
          href={`/projects/${project.id}/ui/screens/${screen.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to screen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit screen
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <UiScreenForm projectId={project.id} screen={screen} />
      </div>
    </div>
  );
}
