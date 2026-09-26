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
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-3xl">
        <div className="hero-panel px-8 py-16 text-center sm:px-12 sm:py-20">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[var(--surface-1)]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--surface-1)]" />
              Project Planner
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Plan projects.
              <br />
              Capture decisions.
              <br />
              Stay in control.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
              An AI Project Planner that structures your requirements,
              decisions, architecture, tasks, and agent prompts. You make the
              calls; the tool keeps things organized.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/register"
                size="lg"
                className="!bg-[var(--surface-1)] !text-[var(--brand)] hover:!bg-[var(--surface-1)]/90"
              >
                Create account
              </ButtonLink>
              <ButtonLink
                href="/login"
                size="lg"
                className="!bg-[var(--surface-1)]/10 !text-white !border !border-white/30 backdrop-blur hover:!bg-[var(--surface-1)]/20"
              >
                Sign in
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            title="Requirements"
            description="Define what your project needs to accomplish."
          />
          <FeatureCard
            title="Decisions"
            description="Record choices and the rationale behind them."
          />
          <FeatureCard
            title="Domain & ERD"
            description="Model entities, attributes, and relationships."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card-glass p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
