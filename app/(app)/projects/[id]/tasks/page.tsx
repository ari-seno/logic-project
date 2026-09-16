import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  TaskBlockedBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
  TaskTypeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listTasksByProject } from "@/lib/tasks/queries";
import {
  deriveBlockedByDependency,
  listDependenciesByProject,
} from "@/lib/tasks/dependencies/queries";
import { TaskActions } from "@/components/ui/tasks/task-actions";

type SortKey = "position" | "priority" | "updated" | "title";
const STATUS_FILTERS = [
  "all",
  "todo",
  "ready",
  "in_progress",
  "blocked",
  "review",
  "done",
  "cancelled",
] as const;

export default async function TasksListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; type?: string; sort?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  const [allTasks, allDeps] = await Promise.all([
    listTasksByProject({ projectId: project.id }),
    listDependenciesByProject({ projectId: project.id }),
  ]);

  const status =
    sp.status && (STATUS_FILTERS as readonly string[]).includes(sp.status)
      ? sp.status
      : "all";
  const type = sp.type ?? "";
  const sortRaw = sp.sort ?? "position";
  const sort: SortKey =
    sortRaw === "priority" ||
    sortRaw === "updated" ||
    sortRaw === "title"
      ? sortRaw
      : "position";

  const filtered = allTasks.filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (type && t.task_type !== type) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priority") {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    }
    if (sort === "updated") {
      return b.updated_at.localeCompare(a.updated_at);
    }
    if (sort === "title") {
      return a.title.localeCompare(b.title);
    }
    return a.position - b.position;
  });

  const typesAvailable = Array.from(new Set(allTasks.map((t) => t.task_type)));

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="tasks" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {project.name} · {allTasks.length} task
            {allTasks.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink
            href={`/projects/${project.id}/tasks/board`}
            variant="secondary"
          >
            Board
          </ButtonLink>
          <ButtonLink href={`/projects/${project.id}/tasks/new`}>
            New task
          </ButtonLink>
        </div>
      </div>

      <form className="card-glass flex flex-wrap items-end gap-3" action="">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-sm"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type}
            className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {typesAvailable.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-sm"
          >
            <option value="position">Position</option>
            <option value="priority">Priority</option>
            <option value="updated">Updated</option>
            <option value="title">Title</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-[var(--border)] bg-white px-3 py-1 text-sm"
        >
          Apply
        </button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          icon={
            <EmptyStateIcon>
              <path d="M3 6h18M3 12h18M3 18h12" />
            </EmptyStateIcon>
          }
          title="No tasks match these filters"
          description="Try clearing filters or creating a new task."
          action={
            <ButtonLink href={`/projects/${project.id}/tasks/new`}>
              New task
            </ButtonLink>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((t) => {
            const parent = allTasks.find((p) => p.id === t.parent_task_id);
            const blocked = deriveBlockedByDependency(t.id, allDeps, allTasks);
            return (
              <li
                key={t.id}
                className="card-glass flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskTypeBadge type={t.task_type} />
                    <TaskStatusBadge status={t.status} />
                    <TaskPriorityBadge priority={t.priority} />
                    {blocked.blocked ? <TaskBlockedBadge /> : null}
                  </div>
                  <Link
                    href={`/projects/${project.id}/tasks/${t.id}`}
                    className="font-medium hover:underline"
                  >
                    {t.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                    {parent ? (
                      <span>
                        Parent:{" "}
                        <Link
                          href={`/projects/${project.id}/tasks/${parent.id}`}
                          className="hover:underline"
                        >
                          {parent.title}
                        </Link>
                      </span>
                    ) : null}
                    <span>Updated {formatDate(t.updated_at)}</span>
                  </div>
                </div>
                <TaskActions taskId={t.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
