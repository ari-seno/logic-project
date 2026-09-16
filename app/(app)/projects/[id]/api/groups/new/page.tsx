import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ApiGroupForm } from "@/components/api/group-form";
import { getProject } from "@/lib/projects/queries";

export default async function NewApiGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

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
          New API group
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="card-glass">
        <ApiGroupForm projectId={project.id} />
      </div>
    </div>
  );
}
