import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import {
  TaskEffortBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
  TaskTypeBadge,
  TaskBlockedBadge,
} from "@/components/projects/badges";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listTasksByProject, getTask } from "@/lib/tasks/queries";
import {
  deriveBlockedByDependency,
  listDependenciesByProject,
} from "@/lib/tasks/dependencies/queries";
import { buildDependencyChain } from "@/lib/tasks/dependency-chain";
import {
  listTaskRequirements,
  listTaskDecisions,
  listTaskDomains,
  listTaskArchitectureComponents,
  listTaskApiEndpoints,
  listTaskUiScreens,
  listAvailableArtifacts,
} from "@/lib/tasks/traceability/queries";
import {
  TaskActions,
  DetachRequirementAction,
  DetachDecisionAction,
  DetachEntityAction,
  DetachComponentAction,
  DetachEndpointAction,
  DetachUiScreenAction,
} from "@/components/ui/tasks/task-actions";
import { TaskStatusChanger } from "@/components/ui/tasks/task-status-changer";
import {
  TaskContextSummary,
  TaskDependenciesSection,
  TaskDependencyChain,
  TaskDescriptionSection,
  TaskHierarchySection,
  TraceabilitySection,
} from "@/components/ui/tasks/task-detail-sections";

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

      <TaskDescriptionSection task={task} />

      <TaskHierarchySection
        projectId={project.id}
        parent={parent}
        subtasks={children}
        siblings={siblings}
      />

      <TaskDependenciesSection
        projectId={project.id}
        task={task}
        allTasks={allTasks}
        dependsOn={dependsOn}
        blocks={blocks}
        related={related}
        blocked={blocked}
      />

      <TraceabilitySection
        title="Requirements"
        kind="requirement"
        taskId={task.id}
        items={reqs.map((r) => ({
          id: r.id,
          node: (
            <Link
              href={`/projects/${project.id}/requirements`}
              className="hover:underline"
            >
              {r.title}
            </Link>
          ),
        }))}
        available={available.requirements
          .filter((r) => !linkedReqIds.has(r.id))
          .map((r) => ({ id: r.id, label: r.title, secondary: r.type }))}
        detach={(linkId) => (
          <DetachRequirementAction linkId={linkId} taskId={task.id} />
        )}
      />

      <TraceabilitySection
        title="Decisions"
        kind="decision"
        taskId={task.id}
        items={decs.map((d) => ({
          id: d.id,
          node: (
            <Link
              href={`/projects/${project.id}/decisions`}
              className="hover:underline"
            >
              {d.title}
            </Link>
          ),
        }))}
        available={available.decisions
          .filter((d) => !linkedDecIds.has(d.id))
          .map((d) => ({ id: d.id, label: d.title, secondary: d.status }))}
        detach={(linkId) => (
          <DetachDecisionAction linkId={linkId} taskId={task.id} />
        )}
      />

      <TraceabilitySection
        title="Domain entities"
        kind="entity"
        taskId={task.id}
        items={ents.map((e) => ({
          id: e.id,
          node: (
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
          ),
        }))}
        available={available.entities
          .filter((e) => !linkedEntIds.has(e.id))
          .map((e) => ({ id: e.id, label: e.name, secondary: e.domain_name }))}
        detach={(linkId) => (
          <DetachEntityAction linkId={linkId} taskId={task.id} />
        )}
      />

      <TraceabilitySection
        title="Architecture components"
        kind="component"
        taskId={task.id}
        items={comps.map((c) => ({
          id: c.id,
          node: (
            <Link
              href={`/projects/${project.id}/architecture`}
              className="hover:underline"
            >
              {c.name}
            </Link>
          ),
        }))}
        available={available.architectureComponents
          .filter((c) => !linkedCompIds.has(c.id))
          .map((c) => ({ id: c.id, label: c.name, secondary: c.type }))}
        detach={(linkId) => (
          <DetachComponentAction linkId={linkId} taskId={task.id} />
        )}
      />

      <TraceabilitySection
        title="API endpoints"
        kind="endpoint"
        taskId={task.id}
        items={apis.map((a) => ({
          id: a.id,
          node: (
            <span>
              <span className="rounded bg-[var(--surface-1)]/80 px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]">
                {a.method} {a.path}
              </span>{" "}
              {a.name}
            </span>
          ),
        }))}
        available={available.apiEndpoints
          .filter((e) => !linkedApiIds.has(e.id))
          .map((e) => ({
            id: e.id,
            label: e.name,
            secondary: `${e.method} ${e.path}`,
          }))}
        detach={(linkId) => (
          <DetachEndpointAction linkId={linkId} taskId={task.id} />
        )}
      />

      <TraceabilitySection
        title="UI screens"
        kind="screen"
        taskId={task.id}
        items={uis.map((u) => ({
          id: u.id,
          node: (
            <Link
              href={`/projects/${project.id}/ui`}
              className="hover:underline"
            >
              {u.name}
            </Link>
          ),
        }))}
        available={available.uiScreens
          .filter((s) => !linkedUiIds.has(s.id))
          .map((s) => ({ id: s.id, label: s.name, secondary: s.screen_type }))}
        detach={(linkId) => (
          <DetachUiScreenAction linkId={linkId} taskId={task.id} />
        )}
      />

      <TaskContextSummary
        task={task}
        dependsOn={dependsOn}
        allTasks={allTasks}
        reqs={reqs}
        decs={decs}
        ents={ents}
        comps={comps}
        apis={apis}
        uis={uis}
      />

      <TaskDependencyChain chain={chain} />
    </div>
  );
}
