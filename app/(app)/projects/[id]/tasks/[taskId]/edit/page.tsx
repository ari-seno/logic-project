import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { TaskForm } from "@/components/ui/tasks/task-form";
import { getProject } from "@/lib/projects/queries";
import { listTasksByProject, getTask } from "@/lib/tasks/queries";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [task, allTasks] = await Promise.all([
    getTask(taskId),
    listTasksByProject({ projectId: project.id }),
  ]);
  if (!task || task.project_id !== project.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="tasks" />

      <div>
        <Link
          href={`/projects/${project.id}/tasks/${task.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to task
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit task</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <TaskForm
          projectId={project.id}
          task={task}
          parentOptions={allTasks.map((t) => ({ id: t.id, title: t.title }))}
        />
      </div>
    </div>
  );
}
