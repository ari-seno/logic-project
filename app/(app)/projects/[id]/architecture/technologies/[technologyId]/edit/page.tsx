import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureTechnologyForm } from "@/components/architecture/technology-form";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureTechnology } from "@/lib/architecture/technologies/queries";

export default async function EditArchitectureTechnologyPage({
  params,
}: {
  params: Promise<{ id: string; technologyId: string }>;
}) {
  const { id, technologyId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const technology = await getArchitectureTechnology(technologyId);
  if (!technology || technology.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture/technologies/${technology.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to technology
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit technology
        </h1>
      </div>

      <div className="card-glass">
        <ArchitectureTechnologyForm
          projectId={project.id}
          technology={technology}
        />
      </div>
    </div>
  );
}
