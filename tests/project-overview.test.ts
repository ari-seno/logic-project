import { describe, expect, it } from "vitest";

import { mapProjectOverview } from "@/lib/projects/overview";

describe("projects/overview mapping", () => {
  it("defaults every field for a missing payload", () => {
    const overview = mapProjectOverview(null);

    expect(overview.counts.requirements).toBe(0);
    expect(overview.counts.tasks).toEqual({
      total: 0,
      todo: 0,
      ready: 0,
      in_progress: 0,
      blocked: 0,
      review: 0,
      done: 0,
      cancelled: 0,
    });
    expect(overview.health.requirements).toEqual([]);
    expect(overview.health.architecture.components).toEqual([]);
    expect(overview.health.api.responses).toEqual([]);
    expect(overview.health.ui.interactions).toEqual([]);
    expect(overview.health.taskLinks.requirements).toEqual([]);
  });

  it("maps the counts and the health arrays", () => {
    const overview = mapProjectOverview({
      counts: {
        requirements: 4,
        decisions: 2,
        domains: 1,
        entities: 3,
        relationships: 2,
        architectureComponents: 5,
        architectureTechnologies: 6,
        architectureDecisions: 1,
        architectureDependencies: 4,
        apiGroups: 2,
        apiEndpoints: 7,
        uiScreens: 3,
        uiComponents: 8,
        tasks: {
          total: 9,
          todo: 4,
          ready: 0,
          in_progress: 3,
          blocked: 1,
          review: 0,
          done: 1,
          cancelled: 0,
        },
      },
      health: {
        requirements: [
          { id: "r1", type: "functional", description: "text" },
          { id: "r2", type: null, description: null },
        ],
        decisions: [{ id: "d1", status: "accepted" }],
        domains: [{ id: "dom1" }],
        entities: [{ id: "e1" }],
        attributes: [{ entity_id: "e1", is_primary_key: true }],
        relationships: [{ id: "rel1" }],
        architecture: {
          components: [{ id: "c1" }],
          technologies: [{ id: "t1" }],
          dependencies: [{ id: "dep1" }],
        },
        api: {
          endpoints: [{ id: "ep1", group_id: null }],
          responses: [{ endpoint_id: "ep1" }],
        },
        ui: {
          screens: [{ id: "s1" }],
          screenComponents: [{ screen_id: "s1" }],
          interactions: [{ screen_id: "s1" }],
        },
        tasks: [
          { id: "task1", acceptance_criteria: "done when", estimated_effort: "m" },
        ],
        taskLinks: { requirements: [{ id: "link1" }] },
      },
    });

    expect(overview.counts.requirements).toBe(4);
    expect(overview.counts.tasks.in_progress).toBe(3);
    expect(overview.counts.tasks.cancelled).toBe(0);
    expect(overview.health.requirements).toHaveLength(2);
    expect(overview.health.attributes[0]?.is_primary_key).toBe(true);
    expect(overview.health.api.endpoints[0]?.group_id).toBeNull();
    expect(overview.health.tasks[0]?.estimated_effort).toBe("m");
    expect(overview.health.taskLinks.requirements).toHaveLength(1);
  });

  it("ignores unexpected shapes instead of throwing", () => {
    const overview = mapProjectOverview({
      counts: { requirements: "many", tasks: { total: null } },
      health: { requirements: "nope", architecture: 7 },
    });

    expect(overview.counts.requirements).toBe(0);
    expect(overview.counts.tasks.total).toBe(0);
    expect(overview.health.requirements).toEqual([]);
    expect(overview.health.architecture.components).toEqual([]);
  });
});
