import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { TaskForm } from "@/components/ui/tasks/task-form";
import { getProject } from "@/lib/projects/queries";
import { listTasksByProject } from "@/lib/tasks/queries";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const tasks = await listTasksByProject({ projectId: project.id });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="tasks" />

      <div>
        <Link
          href={`/projects/${project.id}/tasks`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to Tasks
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New task</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <TaskForm
          projectId={project.id}
          parentOptions={tasks.map((t) => ({ id: t.id, title: t.title }))}
        />
      </div>
    </div>
  );
}
