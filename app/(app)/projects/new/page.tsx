import Link from "next/link";

import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New project
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Give your project a name and an optional description. You can update
          these later.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
