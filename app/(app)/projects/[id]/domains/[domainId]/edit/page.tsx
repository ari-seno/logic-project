import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { DomainForm } from "@/components/domains/domain-form";
import { getProject } from "@/lib/projects/queries";
import { getDomain } from "@/lib/domains/queries";

export default async function EditDomainPage({
  params,
}: {
  params: Promise<{ id: string; domainId: string }>;
}) {
  const { id, domainId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const domain = await getDomain(domainId);
  if (!domain || domain.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains/${domain.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to domain
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit domain
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {domain.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-6">
        <DomainForm projectId={project.id} domain={domain} />
      </div>
    </div>
  );
}
