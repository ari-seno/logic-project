import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ApiResponseForm } from "@/components/api/response-form";
import { getProject } from "@/lib/projects/queries";
import {
  getApiEndpoint,
  getApiResponse,
} from "@/lib/api/endpoints/queries";

export default async function EditApiResponsePage({
  params,
}: {
  params: Promise<{ id: string; endpointId: string; responseId: string }>;
}) {
  const { id, endpointId, responseId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [endpoint, response] = await Promise.all([
    getApiEndpoint(endpointId),
    getApiResponse(responseId),
  ]);
  if (
    !endpoint ||
    endpoint.project_id !== project.id ||
    !response ||
    response.endpoint_id !== endpoint.id
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
          Edit response
        </h1>
        <p className="mt-1 font-mono text-sm text-[var(--muted-foreground)]">
          {endpoint.method} {endpoint.path}
        </p>
      </div>

      <div className="card-glass">
        <ApiResponseForm endpointId={endpoint.id} response={response} />
      </div>
    </div>
  );
}
