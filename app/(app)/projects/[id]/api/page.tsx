import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  ApiAuthBadge,
  ApiMethodBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  listApiGroupsWithEndpointCount,
  type ApiGroupWithEndpointCount,
} from "@/lib/api/groups/queries";
import {
  listApiEndpointsByProjectWithGroupName,
} from "@/lib/api/endpoints/queries";
import { ApiGroupActions } from "@/components/api/group-actions";
import { ApiEndpointActions } from "@/components/api/endpoint-actions";

export default async function ApiOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [groups, endpoints] = await Promise.all([
    listApiGroupsWithEndpointCount({ projectId: project.id }),
    listApiEndpointsByProjectWithGroupName({ projectId: project.id }),
  ]);

  const groupNameById = new Map<string, string>(
    groups.map((g) => [g.id, g.name]),
  );

  const ungrouped = endpoints.filter((e) => !e.group_id);

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="api" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API design</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {project.name} · Design the contract of your future application.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink
            href={`/projects/${project.id}/api/groups/new`}
            variant="secondary"
          >
            New group
          </ButtonLink>
          <ButtonLink
            href={`/projects/${project.id}/api/endpoints/new`}
            variant="secondary"
          >
            New endpoint
          </ButtonLink>
        </div>
      </div>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Groups
        </h2>
        {groups.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No groups yet. Create one to organize related endpoints (e.g.
            Authentication, Users, Projects).
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {groups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                projectId={project.id}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Endpoints
        </h2>
        {endpoints.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No endpoints yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {endpoints.map((e) => (
              <li
                key={e.id}
                className="card-glass flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <ApiMethodBadge method={e.method} />
                  <Link
                    href={`/projects/${project.id}/api/${e.id}`}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {e.path}
                  </Link>
                  <span className="text-sm text-[var(--foreground)]">
                    {e.name}
                  </span>
                  {e.group_id ? (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      in {groupNameById.get(e.group_id) ?? "—"}
                    </span>
                  ) : null}
                  <ApiAuthBadge required={e.authentication_required} />
                </div>
                <ApiEndpointActions
                  endpointId={e.id}
                  projectId={project.id}
                  editHref={`/projects/${project.id}/api/${e.id}/edit`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Contract preview
        </h2>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Read-only summary generated from the stored API data. Not editable.
        </p>
        {endpoints.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Add endpoints to see the contract preview.
          </p>
        ) : (
          <pre className="mt-3 overflow-x-auto rounded-md border border-[var(--border)] bg-white/70 p-4 text-xs leading-6 text-[var(--foreground)]">
            {renderContractPreview(groups, endpoints)}
          </pre>
        )}
      </section>

      {ungrouped.length === endpoints.length && endpoints.length === 0 ? null : null}
    </div>
  );
}

function GroupRow({
  group,
  projectId,
}: {
  group: ApiGroupWithEndpointCount;
  projectId: string;
}) {
  return (
    <li
      id={`group-${group.id}`}
      className="card-glass flex flex-wrap items-center justify-between gap-3 p-4"
    >
      <div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/api/groups/${group.id}/edit`}
            className="text-base font-semibold hover:underline"
          >
            {group.name}
          </Link>
          {group.prefix ? (
            <span className="rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)] ring-1 ring-inset ring-[var(--border)]">
              {group.prefix}
            </span>
          ) : null}
        </div>
        {group.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
            {group.description}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {group.endpoint_count} endpoint{group.endpoint_count === 1 ? "" : "s"}{" "}
          · Updated {formatDate(group.updated_at)}
        </p>
      </div>
      <ApiGroupActions groupId={group.id} projectId={projectId} />
    </li>
  );
}

function renderContractPreview(
  groups: ApiGroupWithEndpointCount[],
  endpoints: { id: string; method: string; path: string; name: string; authentication_required: boolean; group_id: string | null }[],
): string {
  const lines: string[] = [];
  lines.push("# API contract (preview)");
  lines.push(`# ${endpoints.length} endpoint${endpoints.length === 1 ? "" : "s"} across ${groups.length} group${groups.length === 1 ? "" : "s"}`);
  lines.push("");
  for (const g of groups) {
    const owned = endpoints.filter((e) => e.group_id === g.id);
    lines.push(`# Group: ${g.name}${g.prefix ? `  (${g.prefix})` : ""}`);
    for (const e of owned) lines.push(endpointPreviewLine(e));
    lines.push("");
  }
  const ungrouped = endpoints.filter((e) => !e.group_id);
  if (ungrouped.length > 0) {
    lines.push("# Ungrouped");
    for (const e of ungrouped) lines.push(endpointPreviewLine(e));
  }
  if (endpoints.length === 0) {
    lines.push("(no endpoints yet)");
  }
  return lines.join("\n");
}

function endpointPreviewLine(e: {
  method: string;
  path: string;
  authentication_required: boolean;
  name: string;
}): string {
  const auth = e.authentication_required ? "required" : "optional";
  return `  ${e.method.padEnd(6)} ${e.path.padEnd(40)} # ${e.name} (auth: ${auth})`;
}
