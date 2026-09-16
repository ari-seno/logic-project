import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--brand)]">
          Logic Project
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Plan projects. Capture decisions. Stay in control.
        </h1>
        <p className="mt-4 text-base text-[var(--muted-foreground)] sm:text-lg">
          An AI Project Planner that structures your requirements, decisions,
          architecture, tasks, and agent prompts. You make the calls; the tool
          keeps things organized.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/register" size="lg">
            Create account
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg">
            Sign in
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
