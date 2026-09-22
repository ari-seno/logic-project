import { describe, expect, it } from "vitest";

import {
  AI_STAGES,
  isAiStage,
  stageRevalidatePath,
  type AiStage,
} from "@/lib/ai/stages";
import { AI_STAGE_LABELS } from "@/components/ai/stage-labels";

describe("ai/stages", () => {
  it("exposes every registered stage", () => {
    expect(AI_STAGES).toEqual([
      "requirements",
      "decisions",
      "domains",
      "architecture",
      "api",
    ]);
  });

  it("accepts known stages and rejects everything else", () => {
    expect(isAiStage("requirements")).toBe(true);
    expect(isAiStage("decisions")).toBe(true);
    expect(isAiStage("domains")).toBe(true);
    expect(isAiStage("architecture")).toBe(true);
    expect(isAiStage("api")).toBe(true);
    expect(isAiStage("")).toBe(false);
    expect(isAiStage(null)).toBe(false);
    expect(isAiStage(3)).toBe(false);
  });

  it("builds the revalidate path for each stage", () => {
    expect(stageRevalidatePath("requirements", "p1")).toBe(
      "/projects/p1/requirements",
    );
    expect(stageRevalidatePath("decisions", "p1")).toBe("/projects/p1/decisions");
    expect(stageRevalidatePath("domains", "p1")).toBe("/projects/p1/domains/erd");
    expect(stageRevalidatePath("architecture", "p1")).toBe(
      "/projects/p1/architecture",
    );
    expect(stageRevalidatePath("api", "p1")).toBe("/projects/p1/api");
  });
});

describe("ai stage labels registry", () => {
  it("has a complete label set for every stage", () => {
    for (const stage of AI_STAGES) {
      const labels = AI_STAGE_LABELS[stage];
      expect(labels.id).toBe(stage);
      expect(labels.singular.length).toBeGreaterThan(0);
      expect(labels.plural.length).toBeGreaterThan(0);
      expect(labels.drawerTitle.length).toBeGreaterThan(0);
      expect(labels.subtitleFallback.length).toBeGreaterThan(0);
      expect(labels.setupCopy.length).toBeGreaterThan(0);
      expect(labels.promptPlaceholder.length).toBeGreaterThan(0);
      expect(labels.selectionNoun.length).toBeGreaterThan(0);
    }
  });

  it("has no orphan stage without labels", () => {
    const labelled = Object.keys(AI_STAGE_LABELS).sort();
    expect(labelled).toEqual([...AI_STAGES].sort());
  });

  it("names the drawer per stage", () => {
    const titles = AI_STAGES.map(
      (stage: AiStage) => AI_STAGE_LABELS[stage].drawerTitle,
    );
    expect(titles).toEqual([
      "Generate requirements",
      "Generate decisions",
      "Generate domain model",
      "Generate architecture",
      "Generate API design",
    ]);
  });
});
