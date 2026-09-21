import { describe, expect, it } from "vitest";

import { computeProjectHealth } from "@/lib/projects/health";
import { makeBundle, makeEmptyBundle } from "@/tests/fixtures/project-bundle";

describe("computeProjectHealth", () => {
  it("scores an empty project at zero with an empty status", () => {
    const health = computeProjectHealth(makeEmptyBundle());
    expect(health.score).toBe(0);
    expect(health.status).toBe("empty");
    expect(health.sections.every((s) => s.status === "empty")).toBe(true);
    expect(health.sections.every((s) => s.score === 0)).toBe(true);
  });

  it("assigns weights that add up to one hundred", () => {
    const health = computeProjectHealth(makeBundle());
    const total = health.sections.reduce((sum, s) => sum + s.weight, 0);
    expect(total).toBe(100);
  });

  it("scores the shared fixture as ninety-one with the two known gaps", () => {
    const health = computeProjectHealth(makeBundle());
    expect(health.score).toBe(91);
    expect(health.status).toBe("partial");
    expect(health.issues.map((i) => i.id)).toEqual([
      "api:responses",
      "tasks:acceptance",
    ]);
  });

  it("reports a fully specified project as complete with a perfect score", () => {
    const bundle = makeBundle();
    const health = computeProjectHealth({
      ...bundle,
      api: {
        ...bundle.api,
        responses: [
          ...bundle.api.responses,
          { ...bundle.api.responses[0], id: "resp2", endpoint_id: "ep2" },
        ],
      },
      tasks: bundle.tasks.map((task) => ({
        ...task,
        acceptance_criteria: task.acceptance_criteria ?? "Done when verified.",
      })),
    });
    expect(health.score).toBe(100);
    expect(health.status).toBe("complete");
    expect(health.issues).toEqual([]);
    expect(health.sections.every((s) => s.status === "complete")).toBe(true);
  });

  it("flags missing technologies on an otherwise complete architecture", () => {
    const bundle = makeBundle();
    const health = computeProjectHealth({
      ...bundle,
      architecture: { ...bundle.architecture, technologies: [] },
    });
    const architecture = health.sections.find((s) => s.id === "architecture");
    expect(architecture?.status).toBe("partial");
    expect(architecture?.score).toBe(10);
    expect(health.issues.map((i) => i.id)).toContain("architecture:technologies");
  });

  it("treats info-level gaps separately from warnings", () => {
    const bundle = makeBundle();
    const health = computeProjectHealth({
      ...bundle,
      decisions: bundle.decisions.map((d) => ({ ...d, status: "proposed" as const })),
    });
    const issue = health.issues.find((i) => i.id === "decisions:accepted");
    expect(issue?.severity).toBe("info");
    expect(issue?.section).toBe("Decisions");
  });

  it("never exceeds the zero to one hundred range", () => {
    for (const bundle of [makeBundle(), makeEmptyBundle()]) {
      const health = computeProjectHealth(bundle);
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
    }
  });

  it("summarises each section with a passed-over-total detail", () => {
    const health = computeProjectHealth(makeBundle());
    const api = health.sections.find((s) => s.id === "api");
    expect(api?.detail).toBe("2/3 API checks passed");
  });
});
