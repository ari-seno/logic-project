import Link from "next/link";
import type { ReactNode } from "react";

import { TaskDependencyTypeBadge } from "@/components/projects/badges";
import { AddDependencyForm } from "@/components/ui/tasks/add-dependency-form";
import {
  AttachArtifactForm,
  type ArtifactKind,
} from "@/components/ui/tasks/attach-artifact-form";
import { TaskDependencyActions } from "@/components/ui/tasks/task-actions";
import type { Task, TaskDependency } from "@/lib/supabase/types";

type TaskRef = { id: string; title: string };

const SECTION_HEADING =
  "text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]";

const ROW_CLASS =
  "flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm";

export function TaskDescriptionSection({ task }: { task: Task }) {
  return (
    <section className="card-glass">
      <h2 className={SECTION_HEADING}>Description</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm">
        {task.description?.trim() ? (
          task.description
        ) : (
          <span className="italic text-[var(--muted-foreground)]">
            (no description)
          </span>
        )}
      </p>
      <h3 className={`mt-4 ${SECTION_HEADING}`}>Acceptance criteria</h3>
      <pre className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-sm">
        {task.acceptance_criteria?.trim() || "(none)"}
      </pre>
      <h3 className={`mt-4 ${SECTION_HEADING}`}>Implementation notes</h3>
      <pre className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-sm">
        {task.implementation_notes?.trim() || "(none)"}
      </pre>
    </section>
  );
}

export function TaskHierarchySection({
  projectId,
  parent,
  subtasks,
  siblings,
}: {
  projectId: string;
  parent?: TaskRef;
  subtasks: Task[];
  siblings: TaskRef[];
}) {
  return (
    <section className="card-glass">
      <h2 className={SECTION_HEADING}>Hierarchy</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold">Parent</h3>
          {parent ? (
            <Link
              href={`/projects/${projectId}/tasks/${parent.id}`}
              className="mt-1 block rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-2 text-sm hover:underline"
            >
              {parent.title}
            </Link>
          ) : (
            <p className="mt-1 italic text-[var(--muted-foreground)] text-sm">
              Top-level task
            </p>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold">
            Subtasks ({subtasks.length})
          </h3>
          {subtasks.length === 0 ? (
            <p className="mt-1 italic text-[var(--muted-foreground)] text-sm">
              No subtasks.
            </p>
          ) : (
            <ul className="mt-1 flex flex-col gap-1">
              {subtasks.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
                >
                  <Link
                    href={`/projects/${projectId}/tasks/${c.id}`}
                    className="hover:underline"
                  >
                    {c.title}
                  </Link>
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    ({c.status}, {c.priority})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {siblings.length > 0 ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Sibling tasks:{" "}
          {siblings.map((s, idx) => (
            <span key={s.id}>
              {idx > 0 ? ", " : ""}
              <Link
                href={`/projects/${projectId}/tasks/${s.id}`}
                className="hover:underline"
              >
                {s.title}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

function DependencyList({
  projectId,
  taskId,
  rows,
  allTasks,
  otherIdOf,
}: {
  projectId: string;
  taskId: string;
  rows: TaskDependency[];
  allTasks: TaskRef[];
  otherIdOf: (row: TaskDependency) => string;
}) {
  return (
    <ul className="mt-1 flex flex-col gap-1">
      {rows.map((d) => {
        const otherId = otherIdOf(d);
        const t = allTasks.find((x) => x.id === otherId);
        return (
          <li key={d.id} className={ROW_CLASS}>
            <span>
              <TaskDependencyTypeBadge type={d.dependency_type} />{" "}
              <Link
                href={`/projects/${projectId}/tasks/${otherId}`}
                className="hover:underline"
              >
                {t?.title ?? "(deleted)"}
              </Link>
            </span>
            <TaskDependencyActions depId={d.id} taskId={taskId} />
          </li>
        );
      })}
    </ul>
  );
}

export function TaskDependenciesSection({
  projectId,
  task,
  allTasks,
  dependsOn,
  blocks,
  related,
  blocked,
}: {
  projectId: string;
  task: Task;
  allTasks: Task[];
  dependsOn: TaskDependency[];
  blocks: TaskDependency[];
  related: TaskDependency[];
  blocked: { blocked: boolean; blockerIds: string[] };
}) {
  return (
    <section className="card-glass">
      <h2 className={SECTION_HEADING}>Dependencies</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold">
            Depends on ({dependsOn.length})
          </h3>
          {dependsOn.length === 0 ? (
            <p className="mt-1 italic text-[var(--muted-foreground)] text-sm">
              Nothing.
            </p>
          ) : (
            <DependencyList
              projectId={projectId}
              taskId={task.id}
              rows={dependsOn}
              allTasks={allTasks}
              otherIdOf={(d) => d.depends_on_task_id}
            />
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold">Blocks ({blocks.length})</h3>
          {blocks.length === 0 ? (
            <p className="mt-1 italic text-[var(--muted-foreground)] text-sm">
              Nothing.
            </p>
          ) : (
            <DependencyList
              projectId={projectId}
              taskId={task.id}
              rows={blocks}
              allTasks={allTasks}
              otherIdOf={(d) => d.task_id}
            />
          )}
        </div>
      </div>
      {related.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-xs font-semibold">
            Related ({related.length})
          </h3>
          <DependencyList
            projectId={projectId}
            taskId={task.id}
            rows={related}
            allTasks={allTasks}
            otherIdOf={(d) =>
              d.task_id === task.id ? d.depends_on_task_id : d.task_id
            }
          />
        </div>
      ) : null}
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <h3 className="text-sm font-semibold">Add dependency</h3>
        <div className="mt-3">
          <AddDependencyForm
            taskId={task.id}
            candidates={allTasks.filter((t) => t.id !== task.id)}
          />
        </div>
      </div>
      {blocked.blocked ? (
        <p className="mt-3 text-sm text-red-600">
          <strong>Blocked:</strong> waiting on{" "}
          {blocked.blockerIds
            .map(
              (id) => allTasks.find((t) => t.id === id)?.title ?? "(deleted)",
            )
            .join(", ")}
        </p>
      ) : null}
    </section>
  );
}

export function TraceabilitySection({
  title,
  kind,
  taskId,
  items,
  available,
  detach,
}: {
  title: string;
  kind: ArtifactKind;
  taskId: string;
  items: { id: string; node: ReactNode }[];
  available: { id: string; label: string; secondary?: string }[];
  detach: (linkId: string) => ReactNode;
}) {
  return (
    <section className="card-glass">
      <h2 className={SECTION_HEADING}>{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
          None linked.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className={ROW_CLASS}>
              {item.node}
              {detach(item.id)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <AttachArtifactForm
          kind={kind}
          taskId={taskId}
          available={available}
        />
      </div>
    </section>
  );
}

export function TaskContextSummary({
  task,
  dependsOn,
  allTasks,
  reqs,
  decs,
  ents,
  comps,
  apis,
  uis,
}: {
  task: Task;
  dependsOn: TaskDependency[];
  allTasks: TaskRef[];
  reqs: { title: string }[];
  decs: { title: string }[];
  ents: { name: string; domain_name: string | null }[];
  comps: { name: string }[];
  apis: { method: string; path: string; name: string }[];
  uis: { name: string }[];
}) {
  return (
    <section className="card-glass">
      <h2 className={SECTION_HEADING}>Task context summary</h2>
      <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-xs leading-6">
        {`TASK
${task.title}

Acceptance criteria
${task.acceptance_criteria?.trim() || "(none)"}

Dependencies
${
  dependsOn.length === 0
    ? "  (none)"
    : dependsOn
        .map(
          (d) =>
            `- ${allTasks.find((t) => t.id === d.depends_on_task_id)?.title ?? "(deleted)"}`,
        )
        .join("\n")
}

Requirements
${reqs.length === 0 ? "  (none)" : reqs.map((r) => `- ${r.title}`).join("\n")}

Decisions
${decs.length === 0 ? "  (none)" : decs.map((d) => `- ${d.title}`).join("\n")}

Domain
${
  ents.length === 0
    ? "  (none)"
    : ents
        .map((e) => `- ${e.name}${e.domain_name ? ` (${e.domain_name})` : ""}`)
        .join("\n")
}

Architecture
${comps.length === 0 ? "  (none)" : comps.map((c) => `- ${c.name}`).join("\n")}

API
${
  apis.length === 0
    ? "  (none)"
    : apis.map((a) => `- ${a.method} ${a.path} (${a.name})`).join("\n")
}

UI
${uis.length === 0 ? "  (none)" : uis.map((u) => `- ${u.name}`).join("\n")}`}
      </pre>
    </section>
  );
}

export function TaskDependencyChain({ chain }: { chain: string[] }) {
  return (
    <section className="card-glass">
      <h2 className={SECTION_HEADING}>Dependency chain (derived)</h2>
      <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-xs leading-6">
        {chain.join("\n")}
      </pre>
    </section>
  );
}
