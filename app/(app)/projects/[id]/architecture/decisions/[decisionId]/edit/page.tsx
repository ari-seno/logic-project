import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureDecisionForm } from "@/components/architecture/decision-form";
import { getProject } from "@/lib/projects/queries";
import { getArchitectureDecision } from "@/lib/architecture/decisions/queries";

export default async function EditArchitectureDecisionPage({
  params,
}: {
  params: Promise<{ id: string; decisionId: string }>;
}) {
  const { id, decisionId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const decision = await getArchitectureDecision(decisionId);
  if (!decision || decision.project_id !== project.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture/decisions/${decision.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to decision
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit decision
        </h1>
      </div>

      <div className="card-glass">
        <ArchitectureDecisionForm
          projectId={project.id}
          decision={decision}
        />
      </div>
    </div>
  );
}
