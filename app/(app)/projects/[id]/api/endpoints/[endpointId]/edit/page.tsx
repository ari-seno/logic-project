import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ApiEndpointForm } from "@/components/api/endpoint-form";
import { getProject } from "@/lib/projects/queries";
import { listApiGroupsByProject } from "@/lib/api/groups/queries";
import { getApiEndpoint } from "@/lib/api/endpoints/queries";

export default async function EditApiEndpointPage({
  params,
}: {
  params: Promise<{ id: string; endpointId: string }>;
}) {
  const { id, endpointId } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [endpoint, groups] = await Promise.all([
    getApiEndpoint(endpointId),
    listApiGroupsByProject({ projectId: project.id }),
  ]);
  if (!endpoint || endpoint.project_id !== project.id) notFound();

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
          Edit API endpoint
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <ApiEndpointForm
          projectId={project.id}
          endpoint={endpoint}
          groups={groups}
        />
      </div>
    </div>
  );
}
