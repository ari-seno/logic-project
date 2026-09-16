import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ApiEndpointForm } from "@/components/api/endpoint-form";
import { getProject } from "@/lib/projects/queries";
import { listApiGroupsByProject } from "@/lib/api/groups/queries";

export default async function NewApiEndpointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const groups = await listApiGroupsByProject({ projectId: project.id });

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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New API endpoint
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <ApiEndpointForm
          projectId={project.id}
          groups={groups}
        />
      </div>
    </div>
  );
}
