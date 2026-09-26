import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { RequirementForm } from "@/components/requirements/requirement-form";
import { getProject } from "@/lib/projects/queries";
import { getRequirement } from "@/lib/requirements/queries";

export default async function EditRequirementPage({
  params,
}: {
  params: Promise<{ id: string; reqId: string }>;
}) {
  const { id, reqId } = await params;
  const [project, requirement] = await Promise.all([
    getProject(id),
    getRequirement(reqId),
  ]);

  if (!project || !requirement || requirement.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="requirements" />

      <div>
        <Link
          href={`/projects/${project.id}/requirements/${requirement.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to requirement
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit requirement
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <RequirementForm projectId={project.id} requirement={requirement} />
      </div>
    </div>
  );
}
