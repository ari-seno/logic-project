import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArchitectureComponentTypeBadge,
  ApiMethodBadge,
  DecisionStatusBadge,
  PriorityBadge,
  RequirementStatusBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
  TypeBadge,
  UiScreenTypeBadge,
} from "@/components/projects/badges";
import { DataCell, DataList, DataRow } from "@/components/ui/data-list";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatChip } from "@/components/ui/stat-chip";
import { formatDate } from "@/lib/utils";
import {
  getSharedProject,
  loadShareSummary,
  type SharedProjectSummary,
} from "@/lib/projects/share";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared project",
  robots: { index: false, follow: false },
};

function EmptyLine({ children }: { children: string }) {
  return <p className="text-sm text-[var(--muted-foreground)]">{children}</p>;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] py-2 last:border-b-0">
      {children}
    </li>
  );
}

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const project = await getSharedProject(token);

  if (!project) notFound();

  const summary: SharedProjectSummary = await loadShareSummary(project.id);
  const entityCountByDomain = new Map<string, number>();
  for (const entity of summary.entities) {
    entityCountByDomain.set(
      entity.domain_id,
      (entityCountByDomain.get(entity.domain_id) ?? 0) + 1,
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand)]">
        Read-only shared view. Anyone with this link can see the project;
        editing is not possible here.
      </div>

      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatChip label="Requirements" value={summary.requirements.length} />
        <StatChip label="Decisions" value={summary.decisions.length} />
        <StatChip label="Domains" value={summary.domains.length} />
        <StatChip label="Entities" value={summary.entities.length} />
        <StatChip label="Architecture" value={summary.components.length} />
        <StatChip label="Endpoints" value={summary.endpoints.length} />
        <StatChip label="Screens" value={summary.screens.length} />
        <StatChip label="Tasks" value={summary.tasks.length} />
        <span className="px-1 text-xs text-[var(--muted-foreground)]">
          Updated {formatDate(project.updated_at)}
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <SectionCard title="Requirements" variant="flat" padding="lg">
          {summary.requirements.length === 0 ? (
            <EmptyLine>No requirements.</EmptyLine>
          ) : (
            <ul className="flex flex-col">
              {summary.requirements.map((requirement) => (
                <Row key={requirement.id}>
                  <span className="font-medium">{requirement.title}</span>
                  <TypeBadge type={requirement.type} />
                  <RequirementStatusBadge status={requirement.status} />
                  <PriorityBadge priority={requirement.priority} />
                </Row>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Decisions" variant="flat" padding="lg">
          {summary.decisions.length === 0 ? (
            <EmptyLine>No decisions.</EmptyLine>
          ) : (
            <ul className="flex flex-col">
              {summary.decisions.map((decision) => (
                <Row key={decision.id}>
                  <span className="font-medium">{decision.title}</span>
                  <DecisionStatusBadge status={decision.status} />
                </Row>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Domain model"
          description={`${summary.domains.length} domain(s) · ${summary.entities.length} entit(ies) · ${summary.relationships} relationship(s)`}
          variant="flat"
          padding="lg"
        >
          {summary.domains.length === 0 ? (
            <EmptyLine>No domains.</EmptyLine>
          ) : (
            <ul className="flex flex-col">
              {summary.domains.map((domain) => (
                <Row key={domain.id}>
                  <span className="font-medium">{domain.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {entityCountByDomain.get(domain.id) ?? 0} entit(ies)
                  </span>
                </Row>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Architecture" variant="flat" padding="lg">
          {summary.components.length === 0 &&
          summary.technologies.length === 0 ? (
            <EmptyLine>No architecture yet.</EmptyLine>
          ) : (
            <ul className="flex flex-col">
              {summary.components.map((component) => (
                <Row key={component.id}>
                  <span className="font-medium">{component.name}</span>
                  <ArchitectureComponentTypeBadge type={component.type} />
                </Row>
              ))}
              {summary.technologies.map((technology) => (
                <Row key={technology.id}>
                  <span className="font-medium">{technology.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {technology.category}
                  </span>
                </Row>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="API design" variant="flat" padding="lg">
          {summary.endpoints.length === 0 ? (
            <EmptyLine>No endpoints.</EmptyLine>
          ) : (
            <DataList
              caption="API endpoints"
              columns={[
                { key: "method", label: "Method" },
                { key: "path", label: "Path" },
                { key: "name", label: "Name" },
              ]}
            >
              {summary.endpoints.map((endpoint) => (
                <DataRow key={endpoint.id}>
                  <DataCell>
                    <ApiMethodBadge method={endpoint.method} />
                  </DataCell>
                  <DataCell mono>{endpoint.path}</DataCell>
                  <DataCell>{endpoint.name ?? "—"}</DataCell>
                </DataRow>
              ))}
            </DataList>
          )}
        </SectionCard>

        <SectionCard title="UI design" variant="flat" padding="lg">
          {summary.screens.length === 0 ? (
            <EmptyLine>No screens.</EmptyLine>
          ) : (
            <ul className="flex flex-col">
              {summary.screens.map((screen) => (
                <Row key={screen.id}>
                  <span className="font-medium">{screen.name}</span>
                  <UiScreenTypeBadge type={screen.screen_type} />
                  <span className="font-mono text-xs text-[var(--muted-foreground)]">
                    {screen.route ?? "—"}
                  </span>
                </Row>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Tasks" variant="flat" padding="lg">
          {summary.tasks.length === 0 ? (
            <EmptyLine>No tasks.</EmptyLine>
          ) : (
            <DataList
              caption="Project tasks"
              columns={[
                { key: "title", label: "Task" },
                { key: "status", label: "Status" },
                { key: "priority", label: "Priority" },
              ]}
            >
              {summary.tasks.map((task) => (
                <DataRow key={task.id}>
                  <DataCell>{task.title}</DataCell>
                  <DataCell>
                    <TaskStatusBadge status={task.status} />
                  </DataCell>
                  <DataCell>
                    <TaskPriorityBadge priority={task.priority} />
                  </DataCell>
                </DataRow>
              ))}
            </DataList>
          )}
        </SectionCard>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
        Shared from{" "}
        <Link href="/" className="font-medium text-[var(--brand-strong)]">
          Logic Project
        </Link>
      </p>
    </main>
  );
}
