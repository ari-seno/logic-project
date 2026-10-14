import { describe, expect, it } from "vitest";

import { computeProjectHealth, type ProjectHealthInput } from "@/lib/projects/health";
import { makeBundle, makeEmptyBundle } from "@/tests/fixtures/project-bundle";
import type { ProjectBundle } from "@/lib/export/bundle";

/**
 * Mirrors the `get_project_overview` health projection: only the fields
 * the checks read. If a check ever starts reading a dropped field, this test
 * fails because the two scores diverge.
 */
function narrow(bundle: ProjectBundle): ProjectHealthInput {
  return {
    requirements: bundle.requirements.map((r) => ({
      id: r.id,
      type: r.type,
      description: r.description,
    })),
    decisions: bundle.decisions.map((d) => ({ id: d.id, status: d.status })),
    domains: bundle.domains.map((d) => ({ id: d.id })),
    entities: bundle.entities.map((e) => ({ id: e.id })),
    attributes: bundle.attributes.map((a) => ({
      entity_id: a.entity_id,
      is_primary_key: a.is_primary_key,
    })),
    relationships: bundle.relationships.map((r) => ({ id: r.id })),
    architecture: {
      components: bundle.architecture.components.map((c) => ({ id: c.id })),
      technologies: bundle.architecture.technologies.map((t) => ({ id: t.id })),
      dependencies: bundle.architecture.dependencies.map((d) => ({ id: d.id })),
    },
    api: {
      endpoints: bundle.api.endpoints.map((e) => ({
        id: e.id,
        group_id: e.group_id,
      })),
      responses: bundle.api.responses.map((r) => ({ endpoint_id: r.endpoint_id })),
    },
    ui: {
      screens: bundle.ui.screens.map((s) => ({ id: s.id })),
      screenComponents: bundle.ui.screenComponents.map((sc) => ({
        screen_id: sc.screen_id,
      })),
      interactions: bundle.ui.interactions.map((i) => ({ screen_id: i.screen_id })),
    },
    tasks: bundle.tasks.map((t) => ({
      id: t.id,
      acceptance_criteria: t.acceptance_criteria,
      estimated_effort: t.estimated_effort,
    })),
    taskLinks: {
      requirements: bundle.taskLinks.requirements.map((l) => ({ id: l.id })),
    },
  };
}

describe("project health input projection", () => {
  it("scores a full bundle and its narrow projection identically", () => {
    const bundle = makeBundle();
    expect(computeProjectHealth(narrow(bundle))).toEqual(
      computeProjectHealth(bundle),
    );
  });

  it("scores an empty bundle and its narrow projection identically", () => {
    const bundle = makeEmptyBundle();
    const health = computeProjectHealth(narrow(bundle));
    expect(health).toEqual(computeProjectHealth(bundle));
    expect(health.score).toBe(0);
  });
});
