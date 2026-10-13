import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Boxes,
  Download,
  FileText,
  Scale,
  Sparkles,
  ClipboardList,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Plan projects, capture decisions",
  description:
    "An AI Project Planner that structures your requirements, decisions, architecture, tasks, and agent prompts while you stay in control.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: FileText,
    title: "Requirements",
    description: "Define what your project needs to accomplish.",
  },
  {
    icon: Scale,
    title: "Decisions",
    description: "Record choices and the rationale behind them.",
  },
  {
    icon: Boxes,
    title: "Domain & ERD",
    description: "Model entities, attributes, and relationships.",
  },
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "Capture",
    description: "Write requirements and decisions in a structured form.",
  },
  {
    icon: Sparkles,
    title: "Generate",
    description: "Let AI draft the next section from what already exists.",
  },
  {
    icon: Download,
    title: "Export",
    description: "Ship a bundle as Markdown, JSON, OpenAPI, SQL, or Mermaid.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-4xl">
        <div className="hero-panel px-8 py-14 text-center sm:px-12 sm:py-16">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[var(--surface-1)]/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--surface-1)]" />
              Project Planner
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
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

        <section className="mt-12">
          <h2 className="text-center text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Everything in one place
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-center text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            How it works
          </h2>
          <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                    <step.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-[var(--muted-foreground)]">
                    Step {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-14 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--muted-foreground)]">
          Logic Project — plan, generate, and export your software design.
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}
