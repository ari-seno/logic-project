import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity } from "lucide-react";

import { DataCell, DataList, DataRow } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import {
  listProjectActivity,
  type ActivityItem,
  type ActivityKind,
} from "@/lib/activity/queries";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<ActivityKind, string> = {
  requirement: "Requirement",
  decision: "Decision",
  domain: "Domain",
  entity: "Entity",
  component: "Component",
  technology: "Technology",
  architecture_decision: "Architecture decision",
  endpoint: "Endpoint",
  screen: "Screen",
  task: "Task",
  ai: "AI suggestions",
};

function hrefFor(projectId: string, item: ActivityItem): string {
  return `/projects/${projectId}/${item.href}`;
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const items = await listProjectActivity(project.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div>
          <ButtonLink href={`/projects/${project.id}`} variant="ghost" size="sm">
            ← Back to project
          </ButtonLink>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {project.name} · {items.length} recent change{items.length === 1 ? "" : "s"} ·
          Requirements, decisions, the domain model, architecture, API, UI, tasks, and AI
          generations, newest first.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing has changed yet"
          icon={<Activity className="h-6 w-6" />}
        />
      ) : (
        <DataList
          caption="Recent project activity"
          columns={[
            { key: "when", label: "When" },
            { key: "what", label: "Change" },
            { key: "item", label: "Item" },
          ]}
        >
          {items.map((item) => (
            <DataRow key={item.id} interactive>
              <DataCell className="whitespace-nowrap text-[var(--muted-foreground)]">
                {formatDateTime(item.at)}
              </DataCell>
              <DataCell>
                <span className="text-[var(--muted-foreground)]">
                  {item.action === "generated"
                    ? "Generated"
                    : item.action === "created"
                      ? "Created"
                      : "Updated"}
                </span>{" "}
                <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  {KIND_LABELS[item.kind]}
                </span>
              </DataCell>
              <DataCell>
                <Link
                  href={hrefFor(project.id, item)}
                  className="font-medium hover:underline"
                >
                  {item.title}
                </Link>
              </DataCell>
            </DataRow>
          ))}
        </DataList>
      )}
    </div>
  );
}
