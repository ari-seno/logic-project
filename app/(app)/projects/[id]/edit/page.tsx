import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ProjectEditForm } from "@/components/project-edit-form";
import { getProject } from "@/lib/projects/queries";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit project</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Update the project name and description.
        </p>
      </div>

      {sp.updated === "1" ? (
        <Alert variant="success">Project updated.</Alert>
      ) : null}

      <section className="card-glass p-6">
        <ProjectEditForm
          projectId={project.id}
          name={project.name}
          description={project.description}
        />
      </section>
    </div>
  );
}
