import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  ApiAuthBadge,
  ApiEntityRoleBadge,
  ApiMethodBadge,
  ApiRequiredBadge,
  ApiStatusCodeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { CreateTaskFromArtifactButton } from "@/components/ui/tasks/create-task-from-artifact-button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  getApiEndpoint,
  listApiParametersByEndpoint,
  getApiRequestBody,
  listApiResponsesByEndpoint,
  listApiErrorsByEndpoint,
  listEndpointEntityLinks,
  listEndpointRequirementLinks,
} from "@/lib/api/endpoints/queries";
import { ApiParameterForm } from "@/components/api/parameter-form";
import { ApiRequestBodyForm } from "@/components/api/request-body-form";
import { ApiResponseForm } from "@/components/api/response-form";
import { ApiErrorForm } from "@/components/api/error-form";
import { ApiParameterActions } from "@/components/api/parameter-actions";
import { ApiRequestBodyActions } from "@/components/api/request-body-actions";
import { ApiResponseActions } from "@/components/api/response-actions";
import { ApiErrorActions } from "@/components/api/error-actions";
import {
  AttachEntityForm,
  AttachRequirementForm,
  DetachEntityButton,
  DetachRequirementButton,
} from "@/components/api/traceability-forms";
import { listEntitiesByProject } from "@/lib/entities/queries";
import { listRequirements } from "@/lib/requirements/queries";

function jsonOrFallback(
  value: unknown,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default async function ApiEndpointDetailPage({
  params,
}: {
  params: Promise<{ id: string; endpointId: string }>;
}) {
  const { id, endpointId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const endpoint = await getApiEndpoint(endpointId);
  if (!endpoint || endpoint.project_id !== project.id) notFound();

  const [
    parameters,
    requestBody,
    responses,
    errors,
    entityLinks,
    requirementLinks,
    allEntities,
    allRequirements,
  ] = await Promise.all([
    listApiParametersByEndpoint(endpoint.id),
    getApiRequestBody(endpoint.id),
    listApiResponsesByEndpoint(endpoint.id),
    listApiErrorsByEndpoint(endpoint.id),
    listEndpointEntityLinks(endpoint.id),
    listEndpointRequirementLinks(endpoint.id),
    listEntitiesByProject(project.id),
    listRequirements({ projectId: project.id }),
  ]);

  const unlinkedEntityIds = new Set(entityLinks.map((l) => l.entity_id));
  const availableEntities = allEntities
    .filter((e) => !unlinkedEntityIds.has(e.id))
    .map((e) => ({ id: e.id, name: e.name }));

  const unlinkedRequirementIds = new Set(requirementLinks.map((l) => l.requirement_id));
  const availableRequirements = allRequirements
    .filter((r) => !unlinkedRequirementIds.has(r.id))
    .map((r) => ({ id: r.id, title: r.title }));

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="api" />

      <div>
        <Link
          href={`/projects/${project.id}/api`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to API
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ApiMethodBadge method={endpoint.method} />
              <h1 className="font-mono text-xl font-semibold tracking-tight">
                {endpoint.path}
              </h1>
              <ApiAuthBadge required={endpoint.authentication_required} />
            </div>
            <h2 className="mt-2 text-base font-medium text-[var(--foreground)]">
              {endpoint.name}
            </h2>
            {endpoint.summary ? (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {endpoint.summary}
              </p>
            ) : null}
            {endpoint.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {endpoint.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(endpoint.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <CreateTaskFromArtifactButton
              kind="endpoint"
              refId={endpoint.id}
              projectId={project.id}
            >
              Create task
            </CreateTaskFromArtifactButton>
            <ButtonLink
              href={`/projects/${project.id}/api/${endpoint.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Parameters
        </h2>
        {parameters.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No parameters yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {parameters.map((p) => (
              <li
                key={p.id}
                className="rounded-md border border-[var(--border)] bg-white/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {p.name}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      ({p.location})
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {p.data_type}
                    </span>
                    <ApiRequiredBadge required={p.required} />
                  </div>
                  <ApiParameterActions
                    endpointId={endpoint.id}
                    parameterId={p.id}
                  />
                </div>
                {p.description ? (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {p.description}
                  </p>
                ) : null}
                {p.example ? (
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Example: <code>{p.example}</code>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add parameter</h3>
          <div className="mt-3">
            <ApiParameterForm endpointId={endpoint.id} />
          </div>
        </div>
      </section>

      {/* Request body (single) */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Request body
        </h2>
        {requestBody ? (
          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-white/80 px-2 py-0.5 font-mono text-xs ring-1 ring-inset ring-[var(--border)]">
                {requestBody.content_type}
              </span>
              <ApiRequestBodyActions endpointId={endpoint.id} />
            </div>
            {requestBody.description ? (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {requestBody.description}
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailBlock label="Schema">
                <pre className="overflow-x-auto rounded-md bg-white/70 p-2 font-mono text-xs">
                  {jsonOrFallback(requestBody.schema_definition)}
                </pre>
              </DetailBlock>
              <DetailBlock label="Example">
                <pre className="overflow-x-auto rounded-md bg-white/70 p-2 font-mono text-xs">
                  {jsonOrFallback(requestBody.example)}
                </pre>
              </DetailBlock>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No request body yet.
          </p>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">
            {requestBody ? "Edit request body" : "Define request body"}
          </h3>
          <div className="mt-3">
            <ApiRequestBodyForm endpointId={endpoint.id} body={requestBody} />
          </div>
        </div>
      </section>

      {/* Responses */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Responses
        </h2>
        {responses.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No responses yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {responses.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-[var(--border)] bg-white/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ApiStatusCodeBadge statusCode={r.status_code} />
                    {r.content_type ? (
                      <span className="font-mono text-xs text-[var(--muted-foreground)]">
                        {r.content_type}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <ButtonLink
                      href={`/projects/${project.id}/api/${endpoint.id}/responses/${r.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </ButtonLink>
                    <ApiResponseActions
                      endpointId={endpoint.id}
                      responseId={r.id}
                    />
                  </div>
                </div>
                {r.description ? (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {r.description}
                  </p>
                ) : null}
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailBlock label="Schema">
                    <pre className="overflow-x-auto rounded-md bg-white/70 p-2 font-mono text-xs">
                      {jsonOrFallback(r.schema_definition)}
                    </pre>
                  </DetailBlock>
                  <DetailBlock label="Example">
                    <pre className="overflow-x-auto rounded-md bg-white/70 p-2 font-mono text-xs">
                      {jsonOrFallback(r.example)}
                    </pre>
                  </DetailBlock>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add response</h3>
          <div className="mt-3">
            <ApiResponseForm endpointId={endpoint.id} />
          </div>
        </div>
      </section>

      {/* Errors */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Errors
        </h2>
        {errors.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No error definitions yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {errors.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-[var(--border)] bg-white/70 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-white/80 px-2 py-0.5 text-xs ring-1 ring-inset ring-[var(--border)]">
                      {e.code}
                    </code>
                    {e.http_status ? (
                      <ApiStatusCodeBadge statusCode={e.http_status} />
                    ) : null}
                    <span className="text-sm">{e.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ButtonLink
                      href={`/projects/${project.id}/api/${endpoint.id}/errors/${e.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </ButtonLink>
                    <ApiErrorActions endpointId={endpoint.id} errorId={e.id} />
                  </div>
                </div>
                {e.description ? (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {e.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Add error</h3>
          <div className="mt-3">
            <ApiErrorForm endpointId={endpoint.id} />
          </div>
        </div>
      </section>

      {/* Traceability */}
      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Domain entities
        </h2>
        {entityLinks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No domain entities linked to this endpoint.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {entityLinks.map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-white/70 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ApiEntityRoleBadge role={link.role} />
                  <Link
                    href={`/projects/${project.id}/domains`}
                    className="font-medium hover:underline"
                  >
                    {link.entity_name}
                  </Link>
                  {link.domain_name ? (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      in {link.domain_name}
                    </span>
                  ) : null}
                </div>
                <DetachEntityButton link={link} endpointId={endpoint.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Attach entity</h3>
          <div className="mt-3">
            <AttachEntityForm
              endpointId={endpoint.id}
              entities={availableEntities}
            />
          </div>
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Requirements
        </h2>
        {requirementLinks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            No requirements linked to this endpoint.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {requirementLinks.map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-white/70 p-3"
              >
                <Link
                  href={`/projects/${project.id}/requirements`}
                  className="font-medium hover:underline"
                >
                  {link.requirement_title}
                </Link>
                <DetachRequirementButton link={link} endpointId={endpoint.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <h3 className="text-sm font-semibold">Link requirement</h3>
          <div className="mt-3">
            <AttachRequirementForm
              endpointId={endpoint.id}
              requirements={availableRequirements}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
