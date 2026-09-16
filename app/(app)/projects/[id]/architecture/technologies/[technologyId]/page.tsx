import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureTechnologyCategoryBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureTechnology } from "@/lib/architecture/technologies/queries";

import { ArchitectureTechnologyActions } from "./technology-actions";

export default async function ArchitectureTechnologyDetailPage({
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
          href={`/projects/${project.id}/architecture/technologies`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to technologies
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {technology.name}
            </h1>
            <div className="mt-1">
              <ArchitectureTechnologyCategoryBadge
                category={technology.category}
              />
            </div>
            {technology.description ? (
              <p className="mt-2 max-w-2xl whitespace-pre-line text-sm">
                {technology.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(technology.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink
              href={`/projects/${project.id}/architecture/technologies/${technology.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <ArchitectureTechnologyActions
              projectId={project.id}
              technologyId={technology.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
