import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { RequirementForm } from "@/components/requirements/requirement-form";
import { getProject } from "@/lib/projects/queries";

export default async function NewRequirementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="requirements" />

      <div>
        <Link
          href={`/projects/${project.id}/requirements`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to requirements
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New requirement
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-6">
        <RequirementForm projectId={project.id} />
      </div>
    </div>
  );
}
