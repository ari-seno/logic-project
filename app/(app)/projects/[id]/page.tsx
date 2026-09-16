import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";

export default async function ProjectDetailPage({
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
      <div>
        <Link
          href="/projects"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Created {formatDateTime(project.created_at)}</span>
              <span>Updated {formatDateTime(project.updated_at)}</span>
            </div>
          </div>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Description
        </h2>
        {project.description ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {project.description}
          </p>
        ) : (
          <p className="mt-2 italic text-sm text-[var(--muted-foreground)]">
            No description yet.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--muted-foreground)]">
        Requirements, tasks, and AI features are coming in a later part.
      </section>
    </div>
  );
}
