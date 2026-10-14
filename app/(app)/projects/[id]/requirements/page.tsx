import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { Breadcrumb } from "@/components/ui/page-header";
import { AiGeneratePanel } from "@/components/ai/ai-generate-panel";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import type { DataListColumn } from "@/components/ui/data-list";
import {
  RequirementsTable,
  type RequirementTableRow,
} from "@/components/ui/requirements/requirements-table";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  countRequirementsByStatus,
  listRequirements,
} from "@/lib/requirements/queries";
import { REQUIREMENT_BULK_STATUSES } from "@/lib/requirements/bulk";
import { getProjectCredentialAction } from "@/lib/ai/credentials-actions";
import { SavedViews } from "@/components/projects/saved-views";
import { listProjectViews } from "@/lib/views/queries";

const STATUS_FILTERS = ["all", ...REQUIREMENT_BULK_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const COLUMNS: DataListColumn[] = [
  { key: "title", label: "Requirement" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "actions", label: "", align: "right" },
];

export default async function RequirementsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const rawStatus = typeof sp.status === "string" ? sp.status : "all";
  const status: StatusFilter = (STATUS_FILTERS as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as StatusFilter)
    : "all";
  const currentQuery = status === "all" ? "" : `status=${status}`;

  const [requirements, statusCounts, credentialResult, views] = await Promise.all([
    listRequirements({
      projectId: project.id,
      status: status === "all" ? undefined : status,
    }),
    countRequirementsByStatus(project.id),
    getProjectCredentialAction(project.id),
    listProjectViews(project.id, "requirements"),
  ]);
  const credential =
    credentialResult.ok && credentialResult.credential
      ? credentialResult.credential
      : null;

  const totalCount = REQUIREMENT_BULK_STATUSES.reduce(
    (sum, key) => sum + (statusCounts[key] ?? 0),
    0,
  );

  const rows: RequirementTableRow[] = requirements.map((requirement) => ({
    id: requirement.id,
    title: requirement.title,
    type: requirement.type,
    status: requirement.status,
    priority: requirement.priority,
    updatedLabel: formatDate(requirement.updated_at),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Projects", href: "/projects" },
            { label: project.name, href: `/projects/${project.id}` },
            { label: "Requirements" },
          ]}
        />
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Requirements
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AiGeneratePanel
              projectId={project.id}
              stage="requirements"
              credential={credential}
            />
            <ButtonLink href={`/projects/${project.id}/requirements/new`}>
              New requirement
            </ButtonLink>
          </div>
        </div>
        <div className="mt-4">
          <ProjectTabs projectId={project.id} active="requirements" />
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={
            <EmptyStateIcon>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </EmptyStateIcon>
          }
          title="No requirements yet"
          description="Define what this project needs to accomplish. Requirements guide every downstream decision."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <AiGeneratePanel
                projectId={project.id}
                stage="requirements"
                credential={credential}
              />
              <ButtonLink href={`/projects/${project.id}/requirements/new`}>
                Add requirement
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <>
          <SegmentedNav
            ariaLabel="Filter requirements by status"
            activeKey={status}
            items={STATUS_FILTERS.map((key) => ({
              key,
              label: key === "all" ? "All" : key,
              href:
                key === "all"
                  ? `/projects/${project.id}/requirements`
                  : `/projects/${project.id}/requirements?status=${key}`,
              count: key === "all" ? totalCount : (statusCounts[key] ?? 0),
            }))}
          />

          <SavedViews
            projectId={project.id}
            scope="requirements"
            views={views}
            currentQuery={currentQuery}
          />

          {requirements.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              No requirements with status “{status}”.
            </p>
          ) : (
            <RequirementsTable
              projectId={project.id}
              rows={rows}
              columns={COLUMNS}
            />
          )}
        </>
      )}
    </div>
  );
}
