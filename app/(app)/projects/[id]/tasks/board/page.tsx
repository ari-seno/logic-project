import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listTasksByProject } from "@/lib/tasks/queries";
import {
  deriveBlockedByDependency,
  listDependenciesByProject,
} from "@/lib/tasks/dependencies/queries";
import {
  TaskBoard,
  type BoardColumn,
  type BoardTask,
} from "@/components/ui/tasks/task-board";

const COLUMNS: BoardColumn[] = [
  { key: "todo", label: "Todo" },
  { key: "ready", label: "Ready" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

export default async function TaskBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [allTasks, allDeps] = await Promise.all([
    listTasksByProject({ projectId: project.id }),
    listDependenciesByProject({ projectId: project.id }),
  ]);

  const tasks: BoardTask[] = allTasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    taskType: task.task_type,
    priority: task.priority,
    blocked: deriveBlockedByDependency(task.id, allDeps, allTasks).blocked,
    updatedLabel: `Updated ${formatDate(task.updated_at)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="tasks" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task board</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {project.name} · {allTasks.length} task
            {allTasks.length === 1 ? "" : "s"} grouped by status
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/tasks`}
          className="text-xs text-[var(--brand)] hover:underline"
        >
          ← Back to flat list
        </Link>
      </div>

      <TaskBoard projectId={project.id} columns={COLUMNS} tasks={tasks} />

      <p className="text-xs text-[var(--muted-foreground)]">
        Drag a card to another column to change its status, or use the status
        dropdown on the card (keyboard friendly).
      </p>
    </div>
  );
}
