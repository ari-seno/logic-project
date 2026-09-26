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
      <div className="hero-panel px-8 py-10 sm:px-10 sm:py-12">
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-white/80">
              Welcome back
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Here&apos;s an overview of your projects.
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonLink
              href="/projects/new"
              size="md"
              className="!bg-[var(--surface-1)] !text-[var(--brand)] hover:!bg-[var(--surface-1)]/90"
            >
              New project
            </ButtonLink>
            <ButtonLink
              href="/projects"
              size="md"
              className="!bg-[var(--surface-1)]/10 !text-white !border !border-white/30 backdrop-blur hover:!bg-[var(--surface-1)]/20"
            >
              View all
            </ButtonLink>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-glass p-6">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Projects
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {count}
          </p>
        </div>
        <div className="card-glass p-6 sm:col-span-2">
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
          <h2 className="text-lg font-semibold tracking-tight">
            Recent projects
          </h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            View all
          </Link>
        </header>
        {projects.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              You don&apos;t have any projects yet.
            </p>
            <div className="mt-4">
              <ButtonLink href="/projects/new">Create your first project</ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <li
                key={project.id}
                className="card-glass p-5 transition-shadow hover:shadow-lg"
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-col gap-2"
                >
                  <span className="text-base font-semibold tracking-tight">
                    {project.name}
                  </span>
                  {project.description ? (
                    <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                      {project.description}
                    </p>
                  ) : null}
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
