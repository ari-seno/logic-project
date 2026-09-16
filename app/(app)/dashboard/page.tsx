import Link from "next/link";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { listProjects } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [projects, count] = await Promise.all([
    listProjects({ limit: 5 }),
    listProjects({ limit: 1000 }).then((p) => p.length),
  ]);

  const email = user.email ?? "";
  const displayName = email.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Here&apos;s an overview of your projects.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Projects
          </p>
          <p className="mt-2 text-3xl font-semibold">{count}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Quick actions
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href="/projects/new">Create project</ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              View all projects
            </ButtonLink>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            View all
          </Link>
        </header>
        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              You don&apos;t have any projects yet.
            </p>
            <div className="mt-4">
              <ButtonLink href="/projects/new">Create your first project</ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-white">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[var(--muted)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {project.name}
                    </p>
                    {project.description ? (
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {project.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
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
