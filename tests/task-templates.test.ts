import { describe, expect, it } from "vitest";

import {
  buildTaskTemplateFromComponent,
  buildTaskTemplateFromDecision,
  buildTaskTemplateFromEndpoint,
  buildTaskTemplateFromEntity,
  buildTaskTemplateFromRequirement,
  buildTaskTemplateFromScreen,
} from "@/lib/tasks/templates";

describe("task template builders", () => {
  it("requirement template uses feature/testing + requirement priority mapping", () => {
    const t = buildTaskTemplateFromRequirement({
      id: "r1",
      title: "User can create a project",
      type: "functional",
      priority: "critical",
      description: "Allows users to make projects",
    });
    expect(t.title).toBe("Implement requirement: User can create a project");
    expect(t.task_type).toBe("feature");
    expect(t.priority).toBe("critical");
    expect(t.status).toBe("todo");
    expect(t.acceptance_criteria).toContain("User can create a project");
    expect(t.description).toBe("Allows users to make projects");
  });

  it("non-functional requirement becomes a testing task", () => {
    const t = buildTaskTemplateFromRequirement({
      id: "r2",
      title: "Response time < 200ms",
      type: "non_functional",
      priority: "high",
      description: null,
    });
    expect(t.task_type).toBe("testing");
    expect(t.priority).toBe("high");
    expect(t.description).toBeNull();
  });

  it("decision template uses refactor + medium", () => {
    const t = buildTaskTemplateFromDecision({
      id: "d1",
      title: "Use Postgres",
      rationale: "We already have it deployed",
    });
    expect(t.title).toBe("Apply decision: Use Postgres");
    expect(t.task_type).toBe("refactor");
    expect(t.priority).toBe("medium");
    expect(t.description).toBe("We already have it deployed");
  });

  it("entity template uses database task_type", () => {
    const t = buildTaskTemplateFromEntity({
      id: "e1",
      name: "Project",
      description: "Represents a user-owned project",
    });
    expect(t.title).toBe("Implement domain entity: Project");
    expect(t.task_type).toBe("database");
    expect(t.acceptance_criteria).toContain("Project");
  });

  it("component template maps type to task_type", () => {
    expect(
      buildTaskTemplateFromComponent({
        id: "c1",
        name: "Backend",
        type: "backend",
        purpose: null,
      }).task_type,
    ).toBe("backend");
    expect(
      buildTaskTemplateFromComponent({
        id: "c2",
        name: "Web",
        type: "frontend",
        purpose: null,
      }).task_type,
    ).toBe("frontend");
    expect(
      buildTaskTemplateFromComponent({
        id: "c3",
        name: "DB",
        type: "database",
        purpose: null,
      }).task_type,
    ).toBe("database");
    expect(
      buildTaskTemplateFromComponent({
        id: "c4",
        name: "Infra",
        type: "infrastructure",
        purpose: null,
      }).task_type,
    ).toBe("infrastructure");
  });

  it("endpoint template includes method/path/auth in acceptance criteria", () => {
    const t = buildTaskTemplateFromEndpoint({
      id: "e1",
      method: "POST",
      path: "/api/projects",
      name: "Create project",
      description: "Create a project",
      authentication_required: true,
    });
    expect(t.title).toBe("Implement API endpoint: POST /api/projects");
    expect(t.task_type).toBe("backend");
    expect(t.priority).toBe("high");
    expect(t.acceptance_criteria).toContain("POST /api/projects");
    expect(t.acceptance_criteria).toContain("Auth requirement (required)");
    // Falls back to summary when description missing
    const fallback = buildTaskTemplateFromEndpoint({
      id: "e2",
      method: "GET",
      path: "/api/x",
      name: "List x",
      description: null,
      authentication_required: false,
    });
    expect(fallback.description).toContain("auth optional");
    expect(fallback.acceptance_criteria).toContain("Auth requirement (optional)");
  });

  it("screen template uses frontend + screen_type + auth", () => {
    const t = buildTaskTemplateFromScreen({
      id: "s1",
      name: "Create Project",
      screen_type: "form",
      purpose: "Allow authenticated users to create a project.",
      authentication_required: true,
    });
    expect(t.title).toBe("Implement UI screen: Create Project");
    expect(t.task_type).toBe("frontend");
    expect(t.acceptance_criteria).toContain("form");
    expect(t.acceptance_criteria).toContain("Auth requirement (required)");
  });
});
