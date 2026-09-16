import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ApiErrorForm } from "@/components/api/error-form";
import { getProject } from "@/lib/projects/queries";
import {
  getApiEndpoint,
  getApiError,
} from "@/lib/api/endpoints/queries";

export default async function EditApiErrorPage({
  params,
}: {
  params: Promise<{ id: string; endpointId: string; errorId: string }>;
}) {
  const { id, endpointId, errorId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [endpoint, apiError] = await Promise.all([
    getApiEndpoint(endpointId),
    getApiError(errorId),
  ]);
  if (
    !endpoint ||
    endpoint.project_id !== project.id ||
    !apiError ||
    apiError.endpoint_id !== endpoint.id
  ) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="api" />

      <div>
        <Link
          href={`/projects/${project.id}/api/${endpoint.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to endpoint
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit error
        </h1>
        <p className="mt-1 font-mono text-sm text-[var(--muted-foreground)]">
          {endpoint.method} {endpoint.path}
        </p>
      </div>

      <div className="card-glass">
        <ApiErrorForm endpointId={endpoint.id} apiError={apiError} />
      </div>
    </div>
  );
}
