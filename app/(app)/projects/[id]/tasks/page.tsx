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
import {
  DataCell,
  DataList,
  DataRow,
  type DataListColumn,
} from "@/components/ui/data-list";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getProjectCredentialAction } from "@/lib/ai/credentials-actions";
import { AiGeneratePanel } from "@/components/ai/ai-generate-panel";
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

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "position", label: "Position" },
  { value: "priority", label: "Priority" },
  { value: "updated", label: "Updated" },
  { value: "title", label: "Title" },
];

function filterHref(
  projectId: string,
  next: { status?: string; type?: string; sort?: string },
  current: { status: string; type: string; sort: SortKey },
) {
  const status = next.status ?? current.status;
  const type = next.type ?? current.type;
  const sort = next.sort ?? current.sort;
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (type) params.set("type", type);
  if (sort !== "position") params.set("sort", sort);
  const qs = params.toString();
  return `/projects/${projectId}/tasks${qs ? `?${qs}` : ""}`;
}

function TASK_COLUMNS(sort: SortKey): DataListColumn[] {
  return [
    { key: "title", label: "Task", sortDirection: sort === "title" ? "asc" : undefined },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority", sortDirection: sort === "priority" ? "desc" : undefined },
    { key: "blocked", label: "Blocked" },
    { key: "actions", label: "Actions", align: "right" },
  ];
}

export default async function TasksListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    status?: string;
    type?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  const [allTasks, allDeps] = await Promise.all([
    listTasksByProject({ projectId: project.id }),
    listDependenciesByProject({ projectId: project.id }),
  ]);

  const credentialResult = await getProjectCredentialAction(project.id);
  const credential =
    credentialResult.ok && credentialResult.credential
      ? credentialResult.credential
      : null;

  const status =
    sp.status && (STATUS_FILTERS as readonly string[]).includes(sp.status)
      ? sp.status
      : "all";
  const type = sp.type ?? "";
  const query = (sp.q ?? "").trim();
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
    if (query) {
      const haystack = `${t.title} ${t.description ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
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
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AiGeneratePanel
            projectId={project.id}
            stage="tasks"
            credential={credential}
          />
          <ButtonLink
            href={`/projects/${project.id}/tasks/board`}
            variant="secondary"
          >
            Board
          </ButtonLink>
          <ButtonLink
            href={`/projects/${project.id}/tasks/new`}
            variant="secondary"
          >
            New task
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SegmentedNav
          ariaLabel="Filter tasks by status"
          activeKey={status}
          items={STATUS_FILTERS.map((s) => ({
            key: s,
            label: s === "all" ? "All" : s.replace(/_/g, " "),
            href: filterHref(project.id, { status: s }, { status, type, sort }),
            count:
              s === "all"
                ? allTasks.length
                : allTasks.filter((t) => t.status === s).length,
          }))}
        />

        <form
          className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-3"
          action={`/projects/${project.id}/tasks`}
        >
          {status !== "all" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <label className="text-xs font-medium" htmlFor="q">
              Search
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Search tasks"
              type="search"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" htmlFor="type">
              Type
            </label>
            <Select id="type" name="type" defaultValue={type} className="w-auto">
              <option value="">All</option>
              {typesAvailable.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" htmlFor="sort">
              Sort by
            </label>
            <Select id="sort" name="sort" defaultValue={sort} className="w-auto">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm"
          >
            Apply
          </button>
        </form>
      </div>

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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <AiGeneratePanel
                projectId={project.id}
                stage="tasks"
                credential={credential}
              />
              <ButtonLink href={`/projects/${project.id}/tasks/new`}>
                New task
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <DataList
          caption="Project tasks"
          columns={TASK_COLUMNS(sort)}
        >
          {sorted.map((t) => {
            const parent = allTasks.find((p) => p.id === t.parent_task_id);
            const blocked = deriveBlockedByDependency(t.id, allDeps, allTasks);
            return (
              <DataRow key={t.id} interactive>
                <DataCell>
                  <Link
                    href={`/projects/${project.id}/tasks/${t.id}`}
                    className="font-medium hover:underline"
                  >
                    {t.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
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
                </DataCell>
                <DataCell>
                  <TaskTypeBadge type={t.task_type} />
                </DataCell>
                <DataCell>
                  <TaskStatusBadge status={t.status} />
                </DataCell>
                <DataCell>
                  <TaskPriorityBadge priority={t.priority} />
                </DataCell>
                <DataCell>
                  {blocked.blocked ? <TaskBlockedBadge /> : null}
                </DataCell>
                <DataCell align="right">
                  <TaskActions taskId={t.id} />
                </DataCell>
              </DataRow>
            );
          })}
        </DataList>
      )}
    </div>
  );
}
