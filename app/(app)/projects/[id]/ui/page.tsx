import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  UiComponentTypeBadge,
  UiScreenTypeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { ApiAuthBadge } from "@/components/projects/badges";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getProjectCredentialAction } from "@/lib/ai/credentials-actions";
import { AiGeneratePanel } from "@/components/ai/ai-generate-panel";
import {
  countUiScreensByProject,
  listUiScreensByProject,
} from "@/lib/ui/screens/queries";
import {
  countUiComponentsByProject,
  listUiComponentsByProject,
} from "@/lib/ui/components/queries";
import {
  countUiFormsByProject,
  countUiInteractionsByProject,
} from "@/lib/ui/forms/queries";
import {
  countUiNavigationItemsByProject,
  listUiNavigationItemsByProject,
} from "@/lib/ui/navigation/queries";
import { UiScreenActions } from "@/components/ui/screens/screen-actions";
import { UiComponentActions } from "@/components/ui/screens/component-actions";
import { UiNavigationItemActions } from "@/components/ui/screens/navigation-actions";

type TreeNode = {
  id: string;
  parentId: string | null;
  label: string;
  children: TreeNode[];
};

function buildTree(items: { id: string; parent_id: string | null; name: string; label: string }[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const i of items) {
    byId.set(i.id, { id: i.id, parentId: i.parent_id, label: i.label, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function renderTree(nodes: TreeNode[], depth = 0): string {
  if (nodes.length === 0) return "  (no items)\n";
  let out = "";
  for (const n of nodes) {
    out += `${"  ".repeat(depth + 1)}- ${n.label}\n`;
    out += renderTree(n.children, depth + 1);
  }
  return out;
}

export default async function UiOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [
    screenCount,
    componentCount,
    formCount,
    interactionCount,
    navigationCount,
    screens,
    components,
    navigationItems,
  ] = await Promise.all([
    countUiScreensByProject(project.id),
    countUiComponentsByProject(project.id),
    countUiFormsByProject(project.id),
    countUiInteractionsByProject(project.id),
    countUiNavigationItemsByProject(project.id),
    listUiScreensByProject({ projectId: project.id }),
    listUiComponentsByProject({ projectId: project.id }),
    listUiNavigationItemsByProject({ projectId: project.id }),
  ]);

  const credentialResult = await getProjectCredentialAction(project.id);
  const credential =
    credentialResult.ok && credentialResult.credential
      ? credentialResult.credential
      : null;

  const tree = buildTree(navigationItems);

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="ui" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">UI design</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {project.name} · Blueprint the screens of your planned application.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AiGeneratePanel
            projectId={project.id}
            stage="ui"
            credential={credential}
          />
          <AiGeneratePanel
            projectId={project.id}
            stage="ui-detail"
            credential={credential}
          />
          <ButtonLink
            href={`/projects/${project.id}/ui/screens/new`}
            variant="secondary"
          >
            New screen
          </ButtonLink>
          <ButtonLink
            href={`/projects/${project.id}/ui/components/new`}
            variant="secondary"
          >
            New component
          </ButtonLink>
          <ButtonLink
            href={`/projects/${project.id}/ui/navigation/new`}
            variant="secondary"
          >
            New navigation
          </ButtonLink>
        </div>
      </div>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Summary
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-5">
          <SummaryStat label="Screens" value={screenCount} />
          <SummaryStat label="Components" value={componentCount} />
          <SummaryStat label="Forms" value={formCount} />
          <SummaryStat label="Interactions" value={interactionCount} />
          <SummaryStat label="Navigation" value={navigationCount} />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Screens
        </h2>
        {screens.length === 0 ? (
          <div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              No screens yet.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AiGeneratePanel
                projectId={project.id}
                stage="ui"
                credential={credential}
              />
            </div>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {screens.map((s) => (
              <li
                key={s.id}
                className="card-glass flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <UiScreenTypeBadge type={s.screen_type} />
                  <Link
                    href={`/projects/${project.id}/ui/screens/${s.id}`}
                    className="font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  {s.route ? (
                    <span className="rounded bg-[var(--surface-1)]/80 px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]">
                      {s.route}
                    </span>
                  ) : null}
                  <ApiAuthBadge required={s.authentication_required} />
                </div>
                <div className="flex shrink-0 gap-2">
                  <UiScreenActions
                    screenId={s.id}
                    projectId={project.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Components
        </h2>
        {components.length === 0 ? (
          <div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              No components yet.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AiGeneratePanel
                projectId={project.id}
                stage="ui"
                credential={credential}
              />
            </div>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {components.map((c) => (
              <li
                key={c.id}
                className="card-glass flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <UiComponentTypeBadge type={c.component_type} />
                  <Link
                    href={`/projects/${project.id}/ui/components/${c.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  {c.technology ? (
                    <span className="rounded bg-[var(--surface-1)]/80 px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]">
                      {c.technology}
                    </span>
                  ) : null}
                </div>
                <UiComponentActions
                  componentId={c.id}
                  projectId={project.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Navigation
        </h2>
        {navigationItems.length === 0 ? (
          <div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              No navigation items yet.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AiGeneratePanel
                projectId={project.id}
                stage="ui"
                credential={credential}
              />
            </div>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {navigationItems.map((n) => (
              <li
                key={n.id}
                className="card-glass flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${project.id}/ui/navigation/${n.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {n.label}
                  </Link>
                  {n.route ? (
                    <span className="rounded bg-[var(--surface-1)]/80 px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]">
                      {n.route}
                    </span>
                  ) : null}
                </div>
                <UiNavigationItemActions
                  itemId={n.id}
                  projectId={project.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Specification preview
        </h2>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Read-only structured summary generated from the stored UI data.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-4 text-xs leading-6 text-[var(--foreground)]">
          {renderPreview(screens, components, navigationItems, tree)}
        </pre>
      </section>

      {tree.length > 0 ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Last navigation update {formatDate(new Date().toISOString())}.
        </p>
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function renderPreview(
  screens: { id: string; name: string; screen_type: string; route: string | null; authentication_required: boolean }[],
  components: { id: string; name: string; component_type: string }[],
  navigationItems: { id: string; parent_id: string | null; label: string; route: string | null }[],
  tree: TreeNode[],
) {
  let out = "# UI specification (preview)\n";
  out += `# ${screens.length} screen${screens.length === 1 ? "" : "s"}, ${components.length} component${components.length === 1 ? "" : "s"}, ${navigationItems.length} navigation item${navigationItems.length === 1 ? "" : "s"}\n\n`;
  out += "## Screens\n";
  if (screens.length === 0) out += "  (none yet)\n";
  for (const s of screens) {
    out += `  - ${s.name} (${s.screen_type})`;
    if (s.route) out += ` route=${s.route}`;
    out += ` auth=${s.authentication_required ? "required" : "optional"}\n`;
  }
  out += "\n## Components\n";
  if (components.length === 0) out += "  (none yet)\n";
  for (const c of components) {
    out += `  - ${c.name} (${c.component_type})\n`;
  }
  out += "\n## Navigation\n";
  if (navigationItems.length === 0) out += "  (none yet)\n";
  out += renderTree(tree);
  return out;
}
