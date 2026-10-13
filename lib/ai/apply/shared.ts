export type ApplyItemOutcome =
  | { kind: "created"; index: number; id: string; title: string }
  | { kind: "skipped"; index: number; title: string; reason: "duplicate" | "invalid" }
  | { kind: "failed"; index: number; title: string; error: string };

export type ApplySummary = {
  created: ApplyItemOutcome[];
  skipped: ApplyItemOutcome[];
  failed: ApplyItemOutcome[];
};

export type ApplyRequirementsSummary = ApplySummary;

export function optionalText(value: string): string | null {
  return value ? value : null;
}

export type ErdBundleResult = {
  created?: Array<{ index: number; id: string; title: string }>;
  skipped?: Array<{ index: number; title: string; reason: "duplicate" | "invalid" }>;
};
