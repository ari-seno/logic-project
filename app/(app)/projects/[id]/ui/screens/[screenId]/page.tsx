import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { CreateTaskFromArtifactButton } from "@/components/ui/tasks/create-task-from-artifact-button";
import {
  ApiAuthBadge,
  ApiMethodBadge,
  ApiRequiredBadge,
  UiComponentTypeBadge,
  UiFieldTypeBadge,
  UiScreenEntityRoleBadge,
  UiScreenTypeBadge,
  UiStateTypeBadge,
} from "@/components/projects/badges";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getUiScreen } from "@/lib/ui/screens/queries";
import {
  listScreenComponents,
  type ScreenComponentWithComponent,
} from "@/lib/ui/screen-components/queries";
import { listUiComponentsByProject } from "@/lib/ui/components/queries";
import {
  listUiFormsByScreen,
  listUiFormFields,
  getUiForm,
} from "@/lib/ui/forms/queries";
import {
  listUiStatesByScreen,
  listUiInteractionsByScreen,
} from "@/lib/ui/forms/queries";
import {
  listInteractionEndpoints,
  listScreenRequirements,
  listScreenEntities,
} from "@/lib/ui/traceability/queries";
import { listApiEndpointsByProject } from "@/lib/api/endpoints/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";
import { listRequirements } from "@/lib/requirements/queries";
import { AddScreenComponentForm } from "@/components/ui/screens/add-screen-component-form";
import { UiFormForm } from "@/components/ui/screens/ui-form-form";
import { UiFormFieldForm } from "@/components/ui/screens/ui-form-field-form";
import { UiStateForm } from "@/components/ui/screens/ui-state-form";
import { UiInteractionForm } from "@/components/ui/screens/ui-interaction-form";
import {
  AttachEndpointForm,
  AttachEntityForm,
  AttachRequirementForm,
  DetachEndpointButton,
  DetachEntityButton,
  DetachRequirementButton,
} from "@/components/ui/screens/traceability-forms";
import {
  UiFormActions,
  UiFormFieldActions,
  UiStateActions,
  UiInteractionActions,
  ScreenComponentActions,
} from "@/components/ui/screens/sub-actions";

type ComponentTreeNode = {
  id: string;
  parentId: string | null;
  label: string;
  componentName: string;
  componentType: string;
  required: boolean;
  children: ComponentTreeNode[];
};

function buildComponentTree(
  placements: ScreenComponentWithComponent[],
): ComponentTreeNode[] {
  const byId = new Map<string, ComponentTreeNode>();
  for (const p of placements) {
    byId.set(p.id, {
      id: p.id,
      parentId: p.parent_id,
      label: p.label ?? p.component_name,
      componentName: p.component_name,
      componentType: p.component_type,
      required: p.required,
      children: [],
    });
  }
  const roots: ComponentTreeNode[] = [];
  for (const n of byId.values()) {
    if (n.parentId) {
      const parent = byId.get(n.parentId);
      if (parent) parent.children.push(n);
      else roots.push(n);
    } else {
      roots.push(n);
    }
  }
  return roots;
}

function TreeBranch({
  nodes,
  depth,
  screenId,
  projectId,
}: {
  nodes: ComponentTreeNode[];
  depth: number;
  screenId: string;
  projectId: string;
}) {
  if (nodes.length === 0) return null;
  return (
    <ul className={depth === 0 ? "flex flex-col gap-2" : "ml-4 mt-2 flex flex-col gap-2 border-l border-[var(--border)] pl-3"}>
      {nodes.map((n) => (
        <li key={n.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <UiComponentTypeBadge
                type={n.componentType as never}
              />
              <span className="text-sm font-medium">{n.label}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                ({n.componentName})
              </span>
              {n.required ? <ApiRequiredBadge required /> : null}
            </div>
            <ScreenComponentActions
              placementId={n.id}
              screenId={screenId}
              projectId={projectId}
            />
          </div>
          {n.children.length > 0 ? (
            <TreeBranch
              nodes={n.children}
              depth={depth + 1}
              screenId={screenId}
              projectId={projectId}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function UiScreenDetailPage({
  params,
}: {
  params: Promise<{ id: string; screenId: string }>;
}) {
  const { id, screenId } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const screen = await getUiScreen(screenId);
  if (!screen || screen.project_id !== project.id) notFound();

  const [
    placements,
    allComponents,
    forms,
    states,
    interactions,
    requirementLinks,
    entityLinks,
    allRequirements,
    allEntities,
    allEndpoints,
  ] = await Promise.all([
    listScreenComponents(screen.id),
    listUiComponentsByProject({ projectId: project.id }),
    listUiFormsByScreen(screen.id),
    listUiStatesByScreen(screen.id),
    listUiInteractionsByScreen(screen.id),
    listScreenRequirements(screen.id),
    listScreenEntities(screen.id),
    listRequirements({ projectId: project.id }),
    listEntitiesByProject(project.id),
    listApiEndpointsByProject({ projectId: project.id }),
  ]);

  const tree = buildComponentTree(placements);

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="ui" />

      <div>
        <Link
          href={`/projects/${project.id}/ui`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to UI
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <UiScreenTypeBadge type={screen.screen_type} />
              <h1 className="text-xl font-semibold tracking-tight">
                {screen.name}
              </h1>
              <ApiAuthBadge required={screen.authentication_required} />
            </div>
            {screen.route ? (
              <p className="mt-1 font-mono text-sm text-[var(--muted-foreground)]">
                {screen.route}
              </p>
            ) : null}
            {screen.purpose ? (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {screen.purpose}
              </p>
            ) : null}
            {screen.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {screen.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(screen.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <CreateTaskFromArtifactButton
              kind="screen"
              refId={screen.id}
              projectId={project.id}
            >
              Create task
            </CreateTaskFromArtifactButton>
            <ButtonLink
              href={`/projects/${project.id}/ui/screens/${screen.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit screen
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Components tree */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Components
        </h2>
        {placements.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No components placed on this screen yet.
          </p>
        ) : (
          <div className="mt-3">
            <TreeBranch
              nodes={tree}
              depth={0}
              screenId={screen.id}
              projectId={project.id}
            />
          </div>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add placement</h3>
          <div className="mt-3">
            <AddScreenComponentForm
              screenId={screen.id}
              availableComponents={allComponents}
              existingPlacements={placements}
            />
          </div>
        </div>
      </section>

      {/* Forms + Fields */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Forms
        </h2>
        {forms.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No forms yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {forms.map((f) => <FormBlock formId={f.id} formName={f.name} projectId={project.id} key={f.id} />)}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add form</h3>
          <div className="mt-3">
            <UiFormForm screenId={screen.id} />
          </div>
        </div>
      </section>

      {/* States */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          States
        </h2>
        {states.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No states yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {states.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <UiStateTypeBadge type={s.state_type} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <UiStateActions stateId={s.id} projectId={project.id} />
                </div>
                {s.description ? (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {s.description}
                  </p>
                ) : null}
                {s.behavior ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--muted-foreground)]">
                    {s.behavior}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add state</h3>
          <div className="mt-3">
            <UiStateForm screenId={screen.id} />
          </div>
        </div>
      </section>

      {/* Interactions */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Interactions
        </h2>
        {interactions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No interactions yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {interactions.map((inter) => (
              <InteractionBlock
                key={inter.id}
                interaction={inter}
                projectId={project.id}
                endpoints={allEndpoints}
              />
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add interaction</h3>
          <div className="mt-3">
            <UiInteractionForm screenId={screen.id} />
          </div>
        </div>
      </section>

      {/* Traceability */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Linked requirements
        </h2>
        {requirementLinks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No requirements linked.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {requirementLinks.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3"
              >
                <Link
                  href={`/projects/${project.id}/requirements`}
                  className="font-medium hover:underline"
                >
                  {l.requirement_title}
                </Link>
                <DetachRequirementButton link={l} screenId={screen.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <AttachRequirementForm
            screenId={screen.id}
            requirements={allRequirements.map((r) => ({ id: r.id, title: r.title }))}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Linked domain entities
        </h2>
        {entityLinks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No domain entities linked.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {entityLinks.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <UiScreenEntityRoleBadge role={l.role} />
                  <Link
                    href={`/projects/${project.id}/domains`}
                    className="font-medium hover:underline"
                  >
                    {l.entity_name}
                  </Link>
                  {l.domain_name ? (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      in {l.domain_name}
                    </span>
                  ) : null}
                </div>
                <DetachEntityButton link={l} screenId={screen.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <AttachEntityForm
            screenId={screen.id}
            entities={allEntities.map((e) => ({ id: e.id, name: e.name }))}
          />
        </div>
      </section>
    </div>
  );
}

async function FormBlock({
  formId,
  formName,
  projectId,
}: {
  formId: string;
  formName: string;
  projectId: string;
}) {
  const form = await getUiForm(formId);
  const fields = await listUiFormFields(formId);
  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{formName}</span>
        <UiFormActions formId={formId} projectId={projectId} />
      </div>
      {form?.description ? (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {form.description}
        </p>
      ) : null}
      {form?.submit_label || form?.success_behavior ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {form.submit_label ? <>Submit: {form.submit_label}</> : null}
          {form.submit_label && form.success_behavior ? " · " : null}
          {form.success_behavior ? <>After: {form.success_behavior}</> : null}
        </p>
      ) : null}
      {fields.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1">
          {fields.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded border border-[var(--border)] bg-[var(--surface-1)]/80 px-3 py-1.5 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <UiFieldTypeBadge type={f.field_type} />
                <span className="font-medium">{f.label}</span>
                <span className="font-mono text-xs text-[var(--muted-foreground)]">
                  {f.name}
                </span>
                <ApiRequiredBadge required={f.required} />
              </div>
              <UiFormFieldActions fieldId={f.id} projectId={projectId} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Add field
        </h4>
        <div className="mt-2">
          <UiFormFieldForm formId={formId} />
        </div>
      </div>
    </li>
  );
}

async function InteractionBlock({
  interaction,
  projectId,
  endpoints,
}: {
  interaction: { id: string; name: string; trigger: string; action: string; description: string | null };
  projectId: string;
  endpoints: { id: string; method: string; path: string; name: string }[];
}) {
  const links = await listInteractionEndpoints(interaction.id);
  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{interaction.name}</span>
        </div>
        <UiInteractionActions
          interactionId={interaction.id}
          projectId={projectId}
        />
      </div>
      <p className="mt-1 text-sm">
        <span className="text-[var(--muted-foreground)]">Trigger:</span>{" "}
        {interaction.trigger}{" "}
        <span className="text-[var(--muted-foreground)]">→ Action:</span>{" "}
        {interaction.action}
      </p>
      {interaction.description ? (
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {interaction.description}
        </p>
      ) : null}
      {links.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {links.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-2 rounded border border-[var(--border)] bg-[var(--surface-1)]/80 px-3 py-1.5 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ApiMethodBadge method={l.endpoint_method as never} />
                <span className="font-mono text-xs">{l.endpoint_path}</span>
                <span className="text-[var(--muted-foreground)]">
                  ({l.endpoint_label})
                </span>
              </div>
              <DetachEndpointButton
                link={l}
                interactionId={interaction.id}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <AttachEndpointForm
          interactionId={interaction.id}
          endpoints={endpoints}
        />
      </div>
    </li>
  );
}
