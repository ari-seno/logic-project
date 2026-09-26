import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { DomainForm } from "@/components/domains/domain-form";
import { getProject } from "@/lib/projects/queries";

export default async function NewDomainPage({
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
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to domains
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New domain
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <DomainForm projectId={project.id} />
      </div>
    </div>
  );
}
