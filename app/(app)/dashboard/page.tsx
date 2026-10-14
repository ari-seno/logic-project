import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-card";
import { formatDate } from "@/lib/utils";
import {
  listProjects,
  countProjects,
  countProjectsUpdatedWithinDays,
} from "@/lib/projects/queries";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/login");

  const [projects, count, activeThisWeek] = await Promise.all([
    listProjects({ limit: 5, client: supabase }),
    countProjects(supabase),
    countProjectsUpdatedWithinDays(7, supabase),
  ]);

  const email = user.email ?? "";
  const displayName = email.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Here's an overview of your work."
        actions={
          <>
            <ButtonLink href="/projects/new">New project</ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              View all
            </ButtonLink>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Projects"
          value={count}
          hint={
            count === 0 ? "Create your first project" : "Total projects you own"
          }
        />
        <StatCard
          label="Active this week"
          value={activeThisWeek}
          hint="Projects updated in the last 7 days"
        />
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <p className="text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Quick actions
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href="/projects/new" size="sm">
              Create project
            </ButtonLink>
            <ButtonLink href="/projects" size="sm" variant="secondary">
              View all projects
            </ButtonLink>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Continue"
          className="mb-3"
          action={
            <Link
              href="/projects"
              className="text-sm font-medium text-[var(--brand)] hover:underline"
            >
              View all
            </Link>
          }
        />
        {projects.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              You don&apos;t have any projects yet.
            </p>
            <div className="mt-4">
              <ButtonLink href="/projects/new">
                Create your first project
              </ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-2)]"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold tracking-tight">
                      {project.name}
                    </span>
                    {project.description ? (
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                        {project.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Updated {formatDate(project.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <p className="text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
