import { describe, expect, it } from "vitest";

import { BUNDLE_FORMAT, BUNDLE_VERSION } from "@/lib/export/bundle-json";
import { parseImportBundle, type ImportBundle } from "@/lib/import/bundle";
import {
  PROJECT_TEMPLATES,
  PROJECT_TEMPLATE_SUMMARIES,
  findProjectTemplate,
} from "@/lib/projects/templates";
import {
  ARCHITECTURE_COMPONENT_TYPES,
  ARCHITECTURE_TECHNOLOGY_CATEGORIES,
  ENTITY_DATA_TYPES,
  RELATIONSHIP_TYPES,
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "@/lib/supabase/types";

function envelope(templateId: string) {
  const template = findProjectTemplate(templateId);
  if (!template) throw new Error(`unknown template ${templateId}`);
  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    generatedAt: "2026-01-01T00:00:00.000Z",
    bundle: template.build(),
  };
}

function collectIds(bundle: ImportBundle) {
  const rows = [
    ...bundle.requirements,
    ...bundle.decisions,
    ...bundle.domains,
    ...bundle.entities,
    ...bundle.attributes,
    ...bundle.relationships,
    ...bundle.architecture.components,
    ...bundle.architecture.technologies,
    ...bundle.tasks,
  ];
  return rows.map((row) => String(row.id));
}

describe("project templates", () => {
  it("exposes a summary for every template", () => {
    expect(PROJECT_TEMPLATE_SUMMARIES).toHaveLength(PROJECT_TEMPLATES.length);
    expect(PROJECT_TEMPLATE_SUMMARIES.map((t) => t.id)).toEqual(
      PROJECT_TEMPLATES.map((t) => t.id),
    );
    for (const summary of PROJECT_TEMPLATE_SUMMARIES) {
      expect(summary.label.length).toBeGreaterThan(0);
      expect(summary.description.length).toBeGreaterThan(0);
    }
  });

  it("returns null for an unknown template id", () => {
    expect(findProjectTemplate("does-not-exist")).toBeNull();
  });

  it("builds a bundle the importer accepts", () => {
    for (const template of PROJECT_TEMPLATES) {
      const parsed = parseImportBundle(envelope(template.id));
      expect(parsed.ok, `${template.id} failed validation`).toBe(true);
    }
  });

  it("uses unique row ids inside each bundle", () => {
    for (const template of PROJECT_TEMPLATES) {
      const ids = collectIds(template.build());
      expect(new Set(ids).size, `${template.id} has duplicate ids`).toBe(
        ids.length,
      );
    }
  });

  it("only uses values the database accepts", () => {
    for (const template of PROJECT_TEMPLATES) {
      const bundle = template.build();
      const domainIds = new Set(bundle.domains.map((row) => String(row.id)));
      const entityIds = new Set(bundle.entities.map((row) => String(row.id)));
      const componentIds = new Set(
        bundle.architecture.components.map((row) => String(row.id)),
      );

      for (const row of bundle.requirements) {
        expect(REQUIREMENT_TYPES).toContain(row.type);
        expect(REQUIREMENT_STATUSES).toContain(row.status);
        expect(REQUIREMENT_PRIORITIES).toContain(row.priority);
        expect(String(row.title).length).toBeGreaterThan(0);
      }

      for (const row of bundle.entities) {
        expect(domainIds.has(String(row.domain_id))).toBe(true);
      }

      for (const row of bundle.attributes) {
        expect(entityIds.has(String(row.entity_id))).toBe(true);
        expect(ENTITY_DATA_TYPES).toContain(row.data_type);
      }

      for (const row of bundle.relationships) {
        expect(entityIds.has(String(row.source_entity_id))).toBe(true);
        expect(entityIds.has(String(row.target_entity_id))).toBe(true);
        expect(RELATIONSHIP_TYPES).toContain(row.relationship_type);
      }

      for (const row of bundle.architecture.components) {
        expect(ARCHITECTURE_COMPONENT_TYPES).toContain(row.type);
      }

      for (const row of bundle.architecture.technologies) {
        expect(ARCHITECTURE_TECHNOLOGY_CATEGORIES).toContain(row.category);
      }

      for (const row of bundle.architecture.dependencies) {
        expect(componentIds.has(String(row.source_component_id))).toBe(true);
        expect(componentIds.has(String(row.target_component_id))).toBe(true);
      }

      for (const row of bundle.tasks) {
        expect(TASK_TYPES).toContain(row.task_type);
        expect(TASK_STATUSES).toContain(row.status);
        expect(TASK_PRIORITIES).toContain(row.priority);
      }
    }
  });
});
