import Link from "next/link";

import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { listProjects } from "@/lib/projects/queries";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Manage and open your projects.
          </p>
        </div>
        <ButtonLink href="/projects/new">New project</ButtonLink>
      </div>

      {projects.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Create your first project to start organizing your work.
          </p>
          <div className="mt-4">
            <ButtonLink href="/projects/new">Create your first project</ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="card-glass flex flex-col gap-4 p-6 transition-shadow hover:shadow-lg"
            >
              <Link
                href={`/projects/${project.id}`}
                className="flex flex-col gap-2"
              >
                <span className="text-base font-semibold tracking-tight">
                  {project.name}
                </span>
                {project.description ? (
                  <p className="line-clamp-3 text-sm text-[var(--muted-foreground)]">
                    {project.description}
                  </p>
                ) : (
                  <p className="italic text-sm text-[var(--muted-foreground)]">
                    No description
                  </p>
                )}
              </Link>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
                <div className="flex flex-col">
                  <span>Created {formatDate(project.created_at)}</span>
                  <span>Updated {formatDate(project.updated_at)}</span>
                </div>
                <DeleteProjectButton
                  projectId={project.id}
                  projectName={project.name}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
