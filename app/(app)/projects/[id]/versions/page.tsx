import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SaveVersionButton } from "@/components/projects/save-version-button";
import { VersionsTable } from "@/components/projects/versions-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getProject } from "@/lib/projects/queries";
import { listProjectVersions } from "@/lib/versions/queries";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Versions",
  robots: { index: false, follow: false },
};

export default async function ProjectVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const versions = await listProjectVersions(project.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: "Versions" },
        ]}
        title="Versions"
        description={`${project.name} · ${versions.length} saved version(s) · Snapshots capture every section so you can compare or restore an earlier state.`}
        actions={<SaveVersionButton projectId={project.id} />}
      />

      {versions.length === 0 ? (
        <EmptyState
          title="No versions saved yet"
          description="Save a version before a big change, then restore it as a new project if you need to go back."
          icon={<History className="h-6 w-6" />}
        />
      ) : (
        <VersionsTable projectId={project.id} rows={versions} />
      )}
    </div>
  );
}
