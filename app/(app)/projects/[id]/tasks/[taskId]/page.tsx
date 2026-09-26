import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import {
  TaskDependencyTypeBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
  TaskTypeBadge,
  TaskEffortBadge,
  TaskBlockedBadge,
} from "@/components/projects/badges";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  listTasksByProject,
  getTask,
} from "@/lib/tasks/queries";
import {
  deriveBlockedByDependency,
  listDependenciesByProject,
} from "@/lib/tasks/dependencies/queries";
import {
  listTaskRequirements,
  listTaskDecisions,
  listTaskDomains,
  listTaskArchitectureComponents,
  listTaskApiEndpoints,
  listTaskUiScreens,
  listAvailableArtifacts,
} from "@/lib/tasks/traceability/queries";
import { TaskActions } from "@/components/ui/tasks/task-actions";
import { TaskDependencyActions } from "@/components/ui/tasks/task-actions";
import {
  DetachRequirementAction,
  DetachDecisionAction,
  DetachEntityAction,
  DetachComponentAction,
  DetachEndpointAction,
  DetachUiScreenAction,
} from "@/components/ui/tasks/task-actions";
import { AddDependencyForm } from "@/components/ui/tasks/add-dependency-form";
import { AttachArtifactForm } from "@/components/ui/tasks/attach-artifact-form";
import { TaskStatusChanger } from "@/components/ui/tasks/task-status-changer";

function buildDependencyChain(
  startId: string,
  allTasks: { id: string; title: string }[],
  allDeps: { task_id: string; depends_on_task_id: string; dependency_type: string }[],
): string[] {
  // Simple downstream chain: walk forward (tasks blocked by startId or by ancestors).
  const byTitle = new Map(allTasks.map((t) => [t.id, t.title]));
  const successors = new Map<string, string[]>();
  for (const dep of allDeps) {
    if (dep.dependency_type !== "blocks") continue;
    const arr = successors.get(dep.depends_on_task_id) ?? [];
    arr.push(dep.task_id);
    successors.set(dep.depends_on_task_id, arr);
  }
  const out: string[] = [];
  const seen = new Set<string>();
  function walk(id: string, depth: number) {
    if (seen.has(id) || depth > 8) return;
    seen.add(id);
    const title = byTitle.get(id) ?? id;
    out.push(`${"  ".repeat(depth)}${title}`);
    for (const next of successors.get(id) ?? []) {
      walk(next, depth + 1);
    }
  }
  walk(startId, 0);
  return out;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const task = await getTask(taskId);
  if (!task || task.project_id !== project.id) notFound();

  const [allTasks, allDeps, reqs, decs, ents, comps, apis, uis, available] =
    await Promise.all([
      listTasksByProject({ projectId: project.id }),
      listDependenciesByProject({ projectId: project.id }),
      listTaskRequirements(taskId),
      listTaskDecisions(taskId),
      listTaskDomains(taskId),
      listTaskArchitectureComponents(taskId),
      listTaskApiEndpoints(taskId),
      listTaskUiScreens(taskId),
      listAvailableArtifacts(project.id),
    ]);

  const dependsOn = allDeps.filter(
    (d) => d.task_id === task.id && d.dependency_type === "blocks",
  );
  const blocks = allDeps.filter(
    (d) => d.depends_on_task_id === task.id && d.dependency_type === "blocks",
  );
  const related = allDeps.filter((d) => d.dependency_type === "related");

  const blocked = deriveBlockedByDependency(task.id, allDeps, allTasks);

  const parent = allTasks.find((t) => t.id === task.parent_task_id);
  const children = allTasks.filter((t) => t.parent_task_id === task.id);
  const siblings = allTasks
    .filter((t) => t.parent_task_id === task.parent_task_id)
    .filter((t) => t.id !== task.id);

  const chain = buildDependencyChain(task.id, allTasks, allDeps);

  // Pre-compute "available" (not already linked) for each artifact kind.
  const linkedReqIds = new Set(reqs.map((r) => r.id));
  const linkedDecIds = new Set(decs.map((d) => d.id));
  const linkedEntIds = new Set(ents.map((e) => e.id));
  const linkedCompIds = new Set(comps.map((c) => c.id));
  const linkedApiIds = new Set(apis.map((a) => a.id));
  const linkedUiIds = new Set(uis.map((u) => u.id));

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="tasks" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/projects/${project.id}/tasks`}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            ← Back to Tasks
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
            {task.estimated_effort ? (
              <TaskEffortBadge effort={task.estimated_effort} />
            ) : null}
            {blocked.blocked ? <TaskBlockedBadge /> : null}
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {task.title}
          </h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Updated {formatDate(task.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TaskStatusChanger taskId={task.id} status={task.status} />
          <ButtonLink
            href={`/projects/${project.id}/tasks/${task.id}/edit`}
            variant="secondary"
            size="sm"
          >
            Edit
          </ButtonLink>
          <TaskActions taskId={task.id} />
        </div>
      </div>

      {/* Description / Acceptance / Notes */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {task.description?.trim() ? task.description : <span className="italic text-[var(--muted-foreground)]">(no description)</span>}
        </p>
        <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Acceptance criteria
        </h3>
        <pre className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-sm">
          {task.acceptance_criteria?.trim() || "(none)"}
        </pre>
        <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Implementation notes
        </h3>
        <pre className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-sm">
          {task.implementation_notes?.trim() || "(none)"}
        </pre>
      </section>

      {/* Parent & Subtasks */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Hierarchy
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold">Parent</h3>
            {parent ? (
              <Link
                href={`/projects/${project.id}/tasks/${parent.id}`}
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
            <h3 className="text-xs font-semibold">Subtasks ({children.length})</h3>
            {children.length === 0 ? (
              <p className="mt-1 italic text-[var(--muted-foreground)] text-sm">
                No subtasks.
              </p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {children.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
                  >
                    <Link
                      href={`/projects/${project.id}/tasks/${c.id}`}
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
                  href={`/projects/${project.id}/tasks/${s.id}`}
                  className="hover:underline"
                >
                  {s.title}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </section>

      {/* Dependencies */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Dependencies
        </h2>
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
              <ul className="mt-1 flex flex-col gap-1">
                {dependsOn.map((d) => {
                  const t = allTasks.find((x) => x.id === d.depends_on_task_id);
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
                    >
                      <span>
                        <TaskDependencyTypeBadge type={d.dependency_type} />{" "}
                        <Link
                          href={`/projects/${project.id}/tasks/${d.depends_on_task_id}`}
                          className="hover:underline"
                        >
                          {t?.title ?? "(deleted)"}
                        </Link>
                      </span>
                      <TaskDependencyActions
                        depId={d.id}
                        taskId={task.id}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold">
              Blocks ({blocks.length})
            </h3>
            {blocks.length === 0 ? (
              <p className="mt-1 italic text-[var(--muted-foreground)] text-sm">
                Nothing.
              </p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {blocks.map((d) => {
                  const t = allTasks.find((x) => x.id === d.task_id);
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
                    >
                      <span>
                        <TaskDependencyTypeBadge type={d.dependency_type} />{" "}
                        <Link
                          href={`/projects/${project.id}/tasks/${d.task_id}`}
                          className="hover:underline"
                        >
                          {t?.title ?? "(deleted)"}
                        </Link>
                      </span>
                      <TaskDependencyActions
                        depId={d.id}
                        taskId={task.id}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        {related.length > 0 ? (
          <div className="mt-3">
            <h3 className="text-xs font-semibold">Related ({related.length})</h3>
            <ul className="mt-1 flex flex-col gap-1">
              {related.map((d) => {
                const otherId =
                  d.task_id === task.id ? d.depends_on_task_id : d.task_id;
                const t = allTasks.find((x) => x.id === otherId);
                return (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
                  >
                    <span>
                      <TaskDependencyTypeBadge type={d.dependency_type} />{" "}
                      <Link
                        href={`/projects/${project.id}/tasks/${otherId}`}
                        className="hover:underline"
                      >
                        {t?.title ?? "(deleted)"}
                      </Link>
                    </span>
                    <TaskDependencyActions
                      depId={d.id}
                      taskId={task.id}
                    />
                  </li>
                );
              })}
            </ul>
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
                (id) =>
                  allTasks.find((t) => t.id === id)?.title ?? "(deleted)",
              )
              .join(", ")}
          </p>
        ) : null}
      </section>

      {/* Traceability */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Requirements
        </h2>
        {reqs.length === 0 ? (
          <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
            None linked.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {reqs.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
              >
                <Link
                  href={`/projects/${project.id}/requirements`}
                  className="hover:underline"
                >
                  {r.title}
                </Link>
                <DetachRequirementAction linkId={r.id} taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <AttachArtifactForm
            kind="requirement"
            taskId={task.id}
            available={available.requirements
              .filter((r) => !linkedReqIds.has(r.id))
              .map((r) => ({ id: r.id, label: r.title, secondary: r.type }))}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Decisions
        </h2>
        {decs.length === 0 ? (
          <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
            None linked.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {decs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
              >
                <Link
                  href={`/projects/${project.id}/decisions`}
                  className="hover:underline"
                >
                  {d.title}
                </Link>
                <DetachDecisionAction linkId={d.id} taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <AttachArtifactForm
            kind="decision"
            taskId={task.id}
            available={available.decisions
              .filter((d) => !linkedDecIds.has(d.id))
              .map((d) => ({ id: d.id, label: d.title, secondary: d.status }))}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Domain entities
        </h2>
        {ents.length === 0 ? (
          <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
            None linked.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {ents.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
              >
                <span>
                  <Link
                    href={`/projects/${project.id}/domains`}
                    className="hover:underline"
                  >
                    {e.name}
                  </Link>
                  {e.domain_name ? (
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                      in {e.domain_name}
                    </span>
                  ) : null}
                </span>
                <DetachEntityAction linkId={e.id} taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <AttachArtifactForm
            kind="entity"
            taskId={task.id}
            available={available.entities
              .filter((e) => !linkedEntIds.has(e.id))
              .map((e) => ({ id: e.id, label: e.name, secondary: e.domain_name }))}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Architecture components
        </h2>
        {comps.length === 0 ? (
          <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
            None linked.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {comps.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
              >
                <Link
                  href={`/projects/${project.id}/architecture`}
                  className="hover:underline"
                >
                  {c.name}
                </Link>
                <DetachComponentAction linkId={c.id} taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <AttachArtifactForm
            kind="component"
            taskId={task.id}
            available={available.architectureComponents
              .filter((c) => !linkedCompIds.has(c.id))
              .map((c) => ({ id: c.id, label: c.name, secondary: c.type }))}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          API endpoints
        </h2>
        {apis.length === 0 ? (
          <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
            None linked.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {apis.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
              >
                <span>
                  <span className="rounded bg-[var(--surface-1)]/80 px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]">
                    {a.method} {a.path}
                  </span>{" "}
                  {a.name}
                </span>
                <DetachEndpointAction linkId={a.id} taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <AttachArtifactForm
            kind="endpoint"
            taskId={task.id}
            available={available.apiEndpoints
              .filter((e) => !linkedApiIds.has(e.id))
              .map((e) => ({
                id: e.id,
                label: e.name,
                secondary: `${e.method} ${e.path}`,
              }))}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          UI screens
        </h2>
        {uis.length === 0 ? (
          <p className="mt-2 italic text-[var(--muted-foreground)] text-sm">
            None linked.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {uis.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-3 py-1.5 text-sm"
              >
                <Link
                  href={`/projects/${project.id}/ui`}
                  className="hover:underline"
                >
                  {u.name}
                </Link>
                <DetachUiScreenAction linkId={u.id} taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <AttachArtifactForm
            kind="screen"
            taskId={task.id}
            available={available.uiScreens
              .filter((s) => !linkedUiIds.has(s.id))
              .map((s) => ({ id: s.id, label: s.name, secondary: s.screen_type }))}
          />
        </div>
      </section>

      {/* Context summary (read-only) */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Task context summary
        </h2>
        <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-xs leading-6">
{`TASK
${task.title}

Acceptance criteria
${task.acceptance_criteria?.trim() || "(none)"}

Dependencies
${dependsOn.length === 0 ? "  (none)" : dependsOn.map((d) => `- ${allTasks.find((t) => t.id === d.depends_on_task_id)?.title ?? "(deleted)"}`).join("\n")}

Requirements
${reqs.length === 0 ? "  (none)" : reqs.map((r) => `- ${r.title}`).join("\n")}

Decisions
${decs.length === 0 ? "  (none)" : decs.map((d) => `- ${d.title}`).join("\n")}

Domain
${ents.length === 0 ? "  (none)" : ents.map((e) => `- ${e.name}${e.domain_name ? ` (${e.domain_name})` : ""}`).join("\n")}

Architecture
${comps.length === 0 ? "  (none)" : comps.map((c) => `- ${c.name}`).join("\n")}

API
${apis.length === 0 ? "  (none)" : apis.map((a) => `- ${a.method} ${a.path} (${a.name})`).join("\n")}

UI
${uis.length === 0 ? "  (none)" : uis.map((u) => `- ${u.name}`).join("\n")}`}
        </pre>
      </section>

      {/* Dependency chain */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Dependency chain (derived)
        </h2>
        <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3 text-xs leading-6">
{chain.join("\n")}
        </pre>
      </section>
    </div>
  );
}
