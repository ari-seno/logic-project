import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  TaskPriorityBadge,
  TaskTypeBadge,
  TaskBlockedBadge,
} from "@/components/projects/badges";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listTasksByProject } from "@/lib/tasks/queries";
import {
  deriveBlockedByDependency,
  listDependenciesByProject,
} from "@/lib/tasks/dependencies/queries";
import type { Task } from "@/lib/supabase/types";

const COLUMNS = [
  { key: "todo", label: "Todo" },
  { key: "ready", label: "Ready" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
] as const;

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

  const byColumn = new Map<string, Task[]>();
  for (const col of COLUMNS) byColumn.set(col.key, []);
  for (const t of allTasks) {
    if ((byColumn.get(t.status)?.push(t)) === undefined) continue;
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="tasks" />

      <div className="flex items-end justify-between gap-3">
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = byColumn.get(col.key) ?? [];
          return (
            <section
              key={col.key}
              className="card-glass flex flex-col gap-2 p-3"
              aria-label={col.label}
            >
              <header className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {col.label}
                </h2>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {items.length}
                </span>
              </header>
              {items.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  No tasks in this column.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((t) => {
                    const blocked = deriveBlockedByDependency(
                      t.id,
                      allDeps,
                      allTasks,
                    );
                    return (
                      <li
                        key={t.id}
                        className="rounded-md border border-[var(--border)] bg-white/80 p-2 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TaskTypeBadge type={t.task_type} />
                          <TaskPriorityBadge priority={t.priority} />
                          {blocked.blocked ? <TaskBlockedBadge /> : null}
                        </div>
                        <Link
                          href={`/projects/${project.id}/tasks/${t.id}`}
                          className="mt-1 block font-medium hover:underline"
                        >
                          {t.title}
                        </Link>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          Updated {formatDate(t.updated_at)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        The board is derived from task status. Use the{" "}
        <Link
          href={`/projects/${project.id}/tasks`}
          className="hover:underline"
        >
          flat list
        </Link>{" "}
        to edit status. To change status, open a task and use the status
        controls on its detail page (or any other page that exposes the
        server action).
      </p>
    </div>
  );
}
