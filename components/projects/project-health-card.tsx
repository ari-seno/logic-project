import { loadProjectBundle } from "@/lib/export/bundle";
import { computeProjectHealth, type HealthStatus } from "@/lib/projects/health";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<HealthStatus, string> = {
  complete: "Complete",
  partial: "Needs work",
  empty: "Not started",
};

const STATUS_BADGE_CLASSES: Record<HealthStatus, string> = {
  complete: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
  empty: "bg-zinc-50 text-zinc-500 ring-zinc-200",
};

const STATUS_BAR_CLASSES: Record<HealthStatus, string> = {
  complete: "bg-emerald-500",
  partial: "bg-amber-500",
  empty: "bg-zinc-300",
};

function percent(score: number, weight: number): number {
  if (weight <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((score / weight) * 100)));
}

export async function ProjectHealthCard({ projectId }: { projectId: string }) {
  const bundle = await loadProjectBundle(projectId);

  if (!bundle) {
    return null;
  }

  const health = computeProjectHealth(bundle);
  const warnings = health.issues.filter(
    (issue) => issue.severity === "warning",
  );

  return (
    <div className="mt-5 border-t border-[var(--border)] pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Completeness
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {warnings.length === 0
              ? "Every check passed."
              : `${warnings.length} improvement${
                  warnings.length === 1 ? "" : "s"
                } suggested.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-semibold tracking-tight">
            {health.score}
          </span>
          <span className="text-sm text-[var(--muted-foreground)]">/ 100</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              STATUS_BADGE_CLASSES[health.status],
            )}
          >
            {STATUS_LABELS[health.status]}
          </span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {health.sections.map((section) => (
          <li key={section.id}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium">{section.label}</span>
              <span className="text-[var(--muted-foreground)]">
                {section.detail}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className={cn(
                  "h-full rounded-full",
                  STATUS_BAR_CLASSES[section.status],
                )}
                style={{ width: `${percent(section.score, section.weight)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {health.issues.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
          {health.issues.map((issue) => (
            <li key={issue.id} className="flex items-start gap-2 text-xs">
              <span
                aria-hidden
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  issue.severity === "warning" ? "bg-amber-500" : "bg-zinc-300",
                )}
              />
              <span>
                <span className="font-medium">{issue.section}:</span>{" "}
                <span className="text-[var(--muted-foreground)]">
                  {issue.message}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
