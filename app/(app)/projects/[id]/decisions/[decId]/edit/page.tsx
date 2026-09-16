import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { DecisionForm } from "@/components/decisions/decision-form";
import { getProject } from "@/lib/projects/queries";
import { getDecision } from "@/lib/decisions/queries";

export default async function EditDecisionPage({
  params,
}: {
  params: Promise<{ id: string; decId: string }>;
}) {
  const { id, decId } = await params;
  const [project, decision] = await Promise.all([
    getProject(id),
    getDecision(decId),
  ]);

  if (!project || !decision || decision.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="decisions" />

      <div>
        <Link
          href={`/projects/${project.id}/decisions/${decision.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to decision
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit decision
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-6">
        <DecisionForm projectId={project.id} decision={decision} />
      </div>
    </div>
  );
}
