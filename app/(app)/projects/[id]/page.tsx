import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { ExportMenu } from "@/components/projects/export-menu";
import { ProjectHealthCard } from "@/components/projects/project-health-card";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectHeaderMenu } from "@/components/projects/project-header-menu";
import { ShareProjectDialog } from "@/components/projects/share-project-dialog";
import { StageCard } from "@/components/projects/stage-card";
import {
  DecisionStatusBadge,
  PriorityBadge,
  RequirementStatusBadge,
  TypeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard, SectionHeader } from "@/components/ui/section-card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";
import { listDecisions } from "@/lib/decisions/queries";
import {
  loadProjectOverview,
  mapProjectOverview,
} from "@/lib/projects/overview";
import { AiCredentialPicker } from "@/components/projects/ai-credential-picker";
import { getProjectCredentialAction } from "@/lib/ai/credentials-actions";

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const project = await getProject(id, supabase);

  if (!project) {
    notFound();
  }

  const [overviewResult, recentRequirements, recentDecisions, credentialResult] =
    await Promise.all([
      loadProjectOverview(project.id, supabase),
      listRequirements({ projectId: project.id, limit: 5, client: supabase }),
      listDecisions({ projectId: project.id, limit: 5, client: supabase }),
      getProjectCredentialAction(project.id),
    ]);

  const overview = overviewResult ?? mapProjectOverview(null);
  const counts = overview.counts;

  const aiCredentialSummary = credentialResult.ok
    ? credentialResult.credential
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <PageHeader
          title={project.name}
          breadcrumb={[
            { label: "Projects", href: "/projects" },
            { label: project.name },
          ]}
          description={
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Created {formatDateTime(project.created_at)}</span>
              <span>Updated {formatDateTime(project.updated_at)}</span>
            </span>
          }
          actions={
            <>
              <AiCredentialPicker
                projectId={project.id}
                currentLabel={aiCredentialSummary?.label ?? null}
              />
              <ExportMenu projectId={project.id} />
              <ShareProjectDialog
                projectId={project.id}
                shareEnabled={project.share_enabled}
                shareToken={project.share_token}
              />
              <ProjectHeaderMenu
                projectId={project.id}
                projectName={project.name}
              />
            </>
          }
        />
        <ProjectTabs projectId={project.id} active="overview" />
      </div>

      {sp.updated === "1" ? (
        <Alert variant="success">Project updated.</Alert>
      ) : null}

      <SectionCard
        title="Description"
        variant="flat"
        action={
          <ButtonLink
            href={`/projects/${project.id}/edit`}
            variant="ghost"
            size="sm"
          >
            Edit
          </ButtonLink>
        }
      >
        {project.description ? (
          <p className="whitespace-pre-wrap text-sm leading-7">
            {project.description}
          </p>
        ) : (
          <p className="italic text-sm text-[var(--muted-foreground)]">
            No description yet.
          </p>
        )}
      </SectionCard>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Workflow" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StageCard
            title="Discover"
            subtitle="Requirements and decisions"
            href={`/projects/${project.id}/requirements`}
            done={counts.requirements > 0 || counts.decisions > 0}
            metrics={[
              { label: "Requirements", value: counts.requirements },
              { label: "Decisions", value: counts.decisions },
            ]}
          />
          <StageCard
            title="Model"
            subtitle="Domains, entities, and relationships"
            href={`/projects/${project.id}/domains/erd`}
            done={counts.domains > 0}
            metrics={[
              { label: "Domains", value: counts.domains },
              { label: "Entities", value: counts.entities },
              { label: "Relations", value: counts.relationships },
            ]}
          />
          <StageCard
            title="Architect"
            subtitle="Components, technologies, and decisions"
            href={`/projects/${project.id}/architecture`}
            done={counts.architectureComponents > 0}
            metrics={[
              { label: "Components", value: counts.architectureComponents },
              { label: "Technologies", value: counts.architectureTechnologies },
              { label: "Decisions", value: counts.architectureDecisions },
              { label: "Dependencies", value: counts.architectureDependencies },
            ]}
          />
          <StageCard
            title="Ship"
            subtitle="API, UI, and tasks"
            href={`/projects/${project.id}/tasks`}
            done={counts.tasks.total > 0}
            metrics={[
              { label: "API groups", value: counts.apiGroups },
              { label: "API endpoints", value: counts.apiEndpoints },
              { label: "Screens", value: counts.uiScreens },
              { label: "UI components", value: counts.uiComponents },
              { label: "Tasks", value: counts.tasks.total },
              { label: "In progress", value: counts.tasks.in_progress },
              { label: "Done", value: counts.tasks.done },
            ]}
          />
        </div>
        <SectionCard variant="flat" padding="lg">
          <ProjectHealthCard projectId={project.id} input={overview.health} />
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <header className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Recent Requirements
            </h2>
            <Link
              href={`/projects/${project.id}/requirements`}
              className="text-xs font-medium text-[var(--brand)] hover:underline"
            >
              View all
            </Link>
          </header>
          {recentRequirements.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No requirements yet.
              </p>
              <div className="mt-3">
                <ButtonLink
                  href={`/projects/${project.id}/requirements/new`}
                  size="sm"
                >
                  Add Requirement
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentRequirements.map((req) => (
                <li
                  key={req.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--border-strong)]"
                >
                  <Link
                    href={`/projects/${project.id}/requirements/${req.id}`}
                    className="flex flex-col gap-2"
                  >
                    <span className="font-medium">{req.title}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <TypeBadge type={req.type} />
                      <RequirementStatusBadge status={req.status} />
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Updated {formatDate(req.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <header className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Recent Decisions
            </h2>
            <Link
              href={`/projects/${project.id}/decisions`}
              className="text-xs font-medium text-[var(--brand)] hover:underline"
            >
              View all
            </Link>
          </header>
          {recentDecisions.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No decisions yet.
              </p>
              <div className="mt-3">
                <ButtonLink
                  href={`/projects/${project.id}/decisions/new`}
                  size="sm"
                >
                  Add Decision
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentDecisions.map((dec) => (
                <li
                  key={dec.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--border-strong)]"
                >
                  <Link
                    href={`/projects/${project.id}/decisions/${dec.id}`}
                    className="flex flex-col gap-2"
                  >
                    <span className="font-medium">{dec.title}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <DecisionStatusBadge status={dec.status} />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Updated {formatDate(dec.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
