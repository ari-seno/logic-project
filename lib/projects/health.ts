export type HealthStatus = "complete" | "partial" | "empty";

/**
 * The only fields the completeness checks read. A full `ProjectBundle`
 * satisfies this shape structurally, so callers may pass either the whole
 * bundle or a narrow projection loaded straight from the database.
 */
export interface ProjectHealthInput {
  requirements: Array<{ id: string; type: string | null; description: string | null }>;
  decisions: Array<{ id: string; status: string | null }>;
  domains: Array<{ id: string }>;
  entities: Array<{ id: string }>;
  attributes: Array<{ entity_id: string; is_primary_key: boolean }>;
  relationships: Array<{ id: string }>;
  architecture: {
    components: Array<{ id: string }>;
    technologies: Array<{ id: string }>;
    dependencies: Array<{ id: string }>;
  };
  api: {
    endpoints: Array<{ id: string; group_id: string | null }>;
    responses: Array<{ endpoint_id: string }>;
  };
  ui: {
    screens: Array<{ id: string }>;
    screenComponents: Array<{ screen_id: string }>;
    interactions: Array<{ screen_id: string }>;
  };
  tasks: Array<{
    id: string;
    acceptance_criteria: string | null;
    estimated_effort: string | null;
  }>;
  taskLinks: {
    requirements: Array<{ id: string }>;
  };
}
export type HealthSeverity = "warning" | "info";

export interface ProjectHealthSection {
  id: string;
  label: string;
  weight: number;
  score: number;
  status: HealthStatus;
  detail: string;
}

export interface ProjectHealthIssue {
  id: string;
  section: string;
  message: string;
  severity: HealthSeverity;
}

export interface ProjectHealth {
  score: number;
  status: HealthStatus;
  sections: ProjectHealthSection[];
  issues: ProjectHealthIssue[];
}

interface HealthCheck {
  id: string;
  pass: boolean;
  issue: string;
  severity?: HealthSeverity;
}

interface SectionDefinition {
  id: string;
  label: string;
  weight: number;
  detailNoun: string;
  isEmpty: (bundle: ProjectHealthInput) => boolean;
  checks: (bundle: ProjectHealthInput) => HealthCheck[];
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "requirements",
    label: "Requirements",
    weight: 15,
    detailNoun: "requirement checks",
    isEmpty: (b) => b.requirements.length === 0,
    checks: (b) => [
      {
        id: "present",
        pass: b.requirements.length > 0,
        issue: "No requirements captured yet.",
      },
      {
        id: "functional",
        pass: b.requirements.some((r) => r.type === "functional"),
        issue: "Add at least one functional requirement.",
      },
      {
        id: "non-functional",
        pass: b.requirements.some((r) => r.type === "non_functional"),
        issue: "Add at least one non-functional requirement.",
      },
      {
        id: "described",
        pass: b.requirements.every((r) => hasText(r.description)),
        issue: "Some requirements are missing a description.",
        severity: "info",
      },
    ],
  },
  {
    id: "decisions",
    label: "Decisions",
    weight: 10,
    detailNoun: "decision checks",
    isEmpty: (b) => b.decisions.length === 0,
    checks: (b) => [
      {
        id: "present",
        pass: b.decisions.length > 0,
        issue: "No decisions recorded yet.",
      },
      {
        id: "accepted",
        pass: b.decisions.some((d) => d.status === "accepted"),
        issue: "No decision has been marked as accepted.",
        severity: "info",
      },
    ],
  },
  {
    id: "domain",
    label: "Domain model",
    weight: 20,
    detailNoun: "domain model checks",
    isEmpty: (b) => b.domains.length === 0 && b.entities.length === 0,
    checks: (b) => {
      const entityIds = new Set(b.entities.map((e) => e.id));
      const attributesForEntities = b.attributes.filter((a) =>
        entityIds.has(a.entity_id),
      );
      const entitiesWithPrimaryKey = new Set(
        attributesForEntities
          .filter((a) => a.is_primary_key)
          .map((a) => a.entity_id),
      );
      return [
        {
          id: "domains",
          pass: b.domains.length > 0,
          issue: "No domains defined yet.",
        },
        {
          id: "entities",
          pass: b.entities.length > 0,
          issue: "No entities defined in the domain model.",
        },
        {
          id: "primary-key",
          pass:
            b.entities.length > 0 &&
            b.entities.every((e) => entitiesWithPrimaryKey.has(e.id)),
          issue: "Some entities have no primary key attribute.",
        },
        {
          id: "relationships",
          pass: b.entities.length < 2 || b.relationships.length > 0,
          issue: "Entities are not connected by any relationship.",
        },
      ];
    },
  },
  {
    id: "architecture",
    label: "Architecture",
    weight: 15,
    detailNoun: "architecture checks",
    isEmpty: (b) =>
      b.architecture.components.length === 0 &&
      b.architecture.technologies.length === 0,
    checks: (b) => [
      {
        id: "components",
        pass: b.architecture.components.length > 0,
        issue: "No architecture components defined yet.",
      },
      {
        id: "technologies",
        pass: b.architecture.technologies.length > 0,
        issue: "No technology choices recorded.",
      },
      {
        id: "dependencies",
        pass:
          b.architecture.components.length < 2 ||
          b.architecture.dependencies.length > 0,
        issue: "Components have no dependencies recorded.",
        severity: "info",
      },
    ],
  },
  {
    id: "api",
    label: "API design",
    weight: 15,
    detailNoun: "API checks",
    isEmpty: (b) => b.api.endpoints.length === 0,
    checks: (b) => {
      const documentedEndpoints = new Set(
        b.api.responses.map((r) => r.endpoint_id),
      );
      return [
        {
          id: "endpoints",
          pass: b.api.endpoints.length > 0,
          issue: "No API endpoints designed yet.",
        },
        {
          id: "grouped",
          pass: b.api.endpoints.every((e) => e.group_id !== null),
          issue: "Some endpoints are not assigned to a group.",
          severity: "info",
        },
        {
          id: "responses",
          pass:
            b.api.endpoints.length > 0 &&
            b.api.endpoints.every((e) => documentedEndpoints.has(e.id)),
          issue: "Some endpoints have no documented response.",
        },
      ];
    },
  },
  {
    id: "ui",
    label: "UI design",
    weight: 10,
    detailNoun: "UI checks",
    isEmpty: (b) => b.ui.screens.length === 0,
    checks: (b) => {
      const screensWithComponents = new Set(
        b.ui.screenComponents.map((sc) => sc.screen_id),
      );
      const screensWithInteractions = new Set(
        b.ui.interactions.map((i) => i.screen_id),
      );
      return [
        {
          id: "screens",
          pass: b.ui.screens.length > 0,
          issue: "No UI screens designed yet.",
        },
        {
          id: "components",
          pass:
            b.ui.screens.length > 0 &&
            b.ui.screens.some((s) => screensWithComponents.has(s.id)),
          issue: "No UI components are linked to any screen.",
        },
        {
          id: "interactions",
          pass:
            b.ui.screens.length > 0 &&
            b.ui.screens.some((s) => screensWithInteractions.has(s.id)),
          issue: "No screen interactions documented.",
          severity: "info",
        },
      ];
    },
  },
  {
    id: "tasks",
    label: "Tasks",
    weight: 15,
    detailNoun: "task checks",
    isEmpty: (b) => b.tasks.length === 0,
    checks: (b) => [
      {
        id: "present",
        pass: b.tasks.length > 0,
        issue: "No tasks planned yet.",
      },
      {
        id: "acceptance",
        pass: b.tasks.every((t) => hasText(t.acceptance_criteria)),
        issue: "Some tasks have no acceptance criteria.",
      },
      {
        id: "traceability",
        pass: b.taskLinks.requirements.length > 0,
        issue: "No task is linked back to a requirement.",
        severity: "info",
      },
      {
        id: "effort",
        pass: b.tasks.every((t) => t.estimated_effort !== null),
        issue: "Some tasks have no effort estimate.",
        severity: "info",
      },
    ],
  },
];

export function computeProjectHealth(bundle: ProjectHealthInput): ProjectHealth {
  const sections: ProjectHealthSection[] = [];
  const issues: ProjectHealthIssue[] = [];

  for (const definition of SECTION_DEFINITIONS) {
    const empty = definition.isEmpty(bundle);
    const checks = definition.checks(bundle);
    const total = checks.length || 1;
    const passed = checks.filter((check) => check.pass).length;
    const ratio = empty ? 0 : passed / total;
    const status: HealthStatus =
      ratio === 0 ? "empty" : ratio === 1 ? "complete" : "partial";

    sections.push({
      id: definition.id,
      label: definition.label,
      weight: definition.weight,
      score: Math.round(ratio * definition.weight),
      status,
      detail: `${passed}/${total} ${definition.detailNoun} passed`,
    });

    for (const check of checks) {
      if (check.pass) continue;
      issues.push({
        id: `${definition.id}:${check.id}`,
        section: definition.label,
        message: check.issue,
        severity: check.severity ?? "warning",
      });
    }
  }

  const rawScore = sections.reduce((sum, section) => sum + section.score, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const status: HealthStatus =
    sections.every((section) => section.status === "empty")
      ? "empty"
      : sections.every((section) => section.status === "complete")
        ? "complete"
        : "partial";

  return { score, status, sections, issues };
}
