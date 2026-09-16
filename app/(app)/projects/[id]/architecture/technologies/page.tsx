import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureTechnologyCategoryBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listArchitectureTechnologiesByProject } from "@/lib/architecture/technologies/queries";

export default async function ArchitectureTechnologiesListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const technologies = await listArchitectureTechnologiesByProject({
    projectId: project.id,
  });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to architecture
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Technologies
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink
            href={`/projects/${project.id}/architecture/technologies/new`}
          >
            New technology
          </ButtonLink>
        </div>
      </div>

      {technologies.length === 0 ? (
        <div className="card-glass text-center">
          <h2 className="text-lg font-semibold">No technologies yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Track the languages, frameworks, and services you plan to use.
          </p>
          <div className="mt-4">
            <ButtonLink
              href={`/projects/${project.id}/architecture/technologies/new`}
            >
              Add Technology
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {technologies.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-white/70 px-4 py-3"
            >
              <Link
                href={`/projects/${project.id}/architecture/technologies/${t.id}`}
                className="flex flex-col hover:underline"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Updated {formatDate(t.updated_at)}
                </span>
              </Link>
              <ArchitectureTechnologyCategoryBadge category={t.category} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
