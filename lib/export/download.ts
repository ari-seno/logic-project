import { buildArchitectureMermaid, buildErdMermaid } from "@/lib/diagrams/mermaid";
import type { ProjectBundle } from "@/lib/export/bundle";
import { serializeProjectJson } from "@/lib/export/bundle-json";
import { projectToMarkdown } from "@/lib/export/markdown";
import { serializeOpenApi } from "@/lib/export/openapi";
import { serializeSql } from "@/lib/export/sql";
import { slugify } from "@/lib/utils";

export const EXPORT_FORMATS = [
  "md",
  "json",
  "openapi",
  "sql",
  "mermaid",
] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface ExportFile {
  format: ExportFormat;
  content: string;
  contentType: string;
  filename: string;
}

export interface ExportFileOptions {
  generatedAt?: string;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  md: "text/markdown; charset=utf-8",
  json: "application/json; charset=utf-8",
  openapi: "application/json; charset=utf-8",
  sql: "application/sql; charset=utf-8",
  mermaid: "text/plain; charset=utf-8",
};

const EXTENSIONS: Record<ExportFormat, string> = {
  md: "md",
  json: "json",
  openapi: "openapi.json",
  sql: "sql",
  mermaid: "mmd",
};

export function isExportFormat(value: unknown): value is ExportFormat {
  return (
    typeof value === "string" &&
    (EXPORT_FORMATS as readonly string[]).includes(value)
  );
}

function architectureSource(bundle: ProjectBundle): string {
  return buildArchitectureMermaid(
    bundle.architecture.components,
    bundle.architecture.dependencies,
  );
}

function entitySource(bundle: ProjectBundle): string {
  return buildErdMermaid(
    bundle.entities,
    bundle.attributes,
    bundle.relationships,
  );
}

function renderExport(
  bundle: ProjectBundle,
  format: ExportFormat,
  options: ExportFileOptions,
): string {
  switch (format) {
    case "md":
      return projectToMarkdown(bundle, { generatedAt: options.generatedAt });
    case "json":
      return serializeProjectJson(bundle, { generatedAt: options.generatedAt });
    case "openapi":
      return serializeOpenApi(
        bundle.api,
        {
          name: bundle.project.name,
          description: bundle.project.description,
        },
        { generatedAt: options.generatedAt },
      );
    case "sql":
      return serializeSql(bundle, { generatedAt: options.generatedAt });
    case "mermaid": {
      const architecture = architectureSource(bundle);
      if (architecture) return architecture;
      const entities = entitySource(bundle);
      if (entities) return entities;
      return "%% No diagrams available for this project yet.";
    }
  }
}

export function buildExportFile(
  bundle: ProjectBundle,
  format: ExportFormat,
  options: ExportFileOptions = {},
): ExportFile {
  return {
    format,
    content: renderExport(bundle, format, options),
    contentType: CONTENT_TYPES[format],
    filename: `${slugify(bundle.project.name, "project")}.${EXTENSIONS[format]}`,
  };
}
