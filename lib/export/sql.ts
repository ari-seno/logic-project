import type { ProjectBundle } from "@/lib/export/bundle";
import type { EntityAttribute } from "@/lib/supabase/types";

export interface SqlOptions {
  generatedAt?: string;
}

const DATA_TYPE_SQL: Record<string, string> = {
  uuid: "uuid",
  string: "varchar(255)",
  text: "text",
  integer: "integer",
  decimal: "numeric(12, 2)",
  boolean: "boolean",
  date: "date",
  datetime: "timestamptz",
  json: "jsonb",
};

export function toSnake(value: string, fallback = "unnamed"): string {
  const snake = value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safe = snake || fallback;
  return /^[a-z_]/.test(safe) ? safe : `t_${safe}`;
}

function sqlType(dataType: string): string {
  return DATA_TYPE_SQL[dataType] ?? "text";
}

function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function uniqueColumnName(
  rawName: string,
  usedNames: Set<string>,
): string {
  const base = toSnake(rawName, "column");
  let name = base;
  let suffix = 2;
  while (usedNames.has(name)) {
    name = `${base}_${suffix}`;
    suffix += 1;
  }
  usedNames.add(name);
  return name;
}

function columnDefinition(attribute: EntityAttribute, name: string): string {
  const parts = [name, sqlType(attribute.data_type)];
  if (attribute.is_primary_key) parts.push("PRIMARY KEY");
  if (!attribute.is_required && !attribute.is_primary_key) parts.push("NULL");
  if (attribute.is_required && !attribute.is_primary_key) parts.push("NOT NULL");
  if (attribute.default_value) {
    parts.push(`DEFAULT ${attribute.default_value}`);
  }
  return `  ${parts.join(" ")}`;
}

export function domainsToSql(
  bundle: ProjectBundle,
  options: SqlOptions = {},
): string {
  const { project, domains, entities, attributes, relationships } = bundle;
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const tableNameByEntityId = new Map<string, string>();
  const usedTableNames = new Set<string>();
  for (const entity of entities) {
    const base = toSnake(entity.name, "entity");
    let name = base;
    let suffix = 2;
    while (usedTableNames.has(name)) {
      name = `${base}_${suffix}`;
      suffix += 1;
    }
    usedTableNames.add(name);
    tableNameByEntityId.set(entity.id, name);
  }

  const entityById = new Map(entities.map((e) => [e.id, e]));
  const domainById = new Map(domains.map((d) => [d.id, d]));

  const statements: string[] = [];
  const comments: string[] = [];

  for (const entity of entities) {
    const tableName = tableNameByEntityId.get(entity.id)!;
    const entityAttributes = attributes
      .filter((a) => a.entity_id === entity.id)
      .sort((a, b) => a.position - b.position);

    const usedColumnNames = new Set<string>();
    const columnNameByAttributeId = new Map<string, string>();
    const columns = entityAttributes.map((a) => {
      const name = uniqueColumnName(a.name, usedColumnNames);
      columnNameByAttributeId.set(a.id, name);
      return columnDefinition(a, name);
    });

    const hasPrimaryKey = entityAttributes.some((a) => a.is_primary_key);
    const header = [
      `-- ${entity.name}`,
      domainById.get(entity.domain_id)
        ? `-- domain: ${domainById.get(entity.domain_id)!.name}`
        : null,
      entity.description ? `-- ${entity.description}` : null,
      hasPrimaryKey ? null : "-- NOTE: no primary key declared in the domain model",
    ]
      .filter(Boolean)
      .join("\n");

    statements.push(
      [
        header,
        `CREATE TABLE ${tableName} (`,
        columns.length > 0 ? columns.join(",\n") : "  -- no attributes defined",
        ");",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    for (const attribute of entityAttributes) {
      if (!attribute.description) continue;
      const columnName = columnNameByAttributeId.get(attribute.id)!;
      comments.push(
        `COMMENT ON COLUMN ${tableName}.${columnName} IS ${escapeLiteral(attribute.description)};`,
      );
    }
    if (entity.description) {
      comments.push(
        `COMMENT ON TABLE ${tableName} IS ${escapeLiteral(entity.description)};`,
      );
    }
  }

  // Foreign keys derived from entity relationships.
  const constraints: string[] = [];
  const indexes: string[] = [];

  for (const rel of relationships) {
    const source = entityById.get(rel.source_entity_id);
    const target = entityById.get(rel.target_entity_id);
    if (!source || !target) continue;

    const sourceTable = tableNameByEntityId.get(source.id)!;
    const targetTable = tableNameByEntityId.get(target.id)!;
    const label = toSnake(rel.name ?? target.name, "ref");

    if (rel.relationship_type === "many_to_many") {
      const [leftTable, rightTable] =
        sourceTable <= targetTable
          ? [sourceTable, targetTable]
          : [targetTable, sourceTable];
      const leftEntityId =
        sourceTable <= targetTable ? source.id : target.id;
      const rightEntityId =
        sourceTable <= targetTable ? target.id : source.id;
      const joinTable = toSnake(
        rel.name ?? `${leftTable}_${rightTable}`,
        "join",
      );
      const leftColumn = `${toSnake(entityById.get(leftEntityId)!.name, "left")}_id`;
      const rightColumn = `${toSnake(entityById.get(rightEntityId)!.name, "right")}_id`;

      statements.push(
        [
          `-- ${rel.relationship_type}: ${source.name} <-> ${target.name}${rel.description ? ` — ${rel.description}` : ""}`,
          `CREATE TABLE ${joinTable} (`,
          `  ${leftColumn} uuid NOT NULL REFERENCES ${leftTable} (id) ON DELETE CASCADE,`,
          `  ${rightColumn} uuid NOT NULL REFERENCES ${rightTable} (id) ON DELETE CASCADE,`,
          `  PRIMARY KEY (${leftColumn}, ${rightColumn})`,
          `);`,
        ].join("\n"),
      );
      continue;
    }

    // one_to_many: FK lives on the many side (target).
    // many_to_one / one_to_one: FK lives on the source side.
    const childTable =
      rel.relationship_type === "one_to_many" ? targetTable : sourceTable;
    const parentTable =
      rel.relationship_type === "one_to_many" ? sourceTable : targetTable;
    const columnName = `${toSnake(parentTable, "parent")}_id`;
    const constraintName = `fk_${childTable}_${label}`;

    constraints.push(
      `ALTER TABLE ${childTable}\n  ADD CONSTRAINT ${constraintName}\n  FOREIGN KEY (${columnName}) REFERENCES ${parentTable} (id) ON DELETE CASCADE;`,
    );
    indexes.push(
      `CREATE INDEX idx_${childTable}_${columnName} ON ${childTable} (${columnName});`,
    );
  }

  const header = [
    `-- PostgreSQL DDL generated by Logic Project`,
    `-- project: ${project.name}`,
    `-- generated: ${generatedAt}`,
    `-- NOTE: review before applying; types and defaults come from the domain model.`,
  ].join("\n");

  return (
    [
      header,
      statements.join("\n\n"),
      constraints.length > 0 ? constraints.join("\n\n") : "",
      indexes.length > 0 ? indexes.join("\n") : "",
      comments.length > 0 ? comments.join("\n") : "",
    ]
      .filter((block) => block.trim())
      .join("\n\n")
      .trim() + "\n"
  );
}

export function serializeSql(
  bundle: ProjectBundle,
  options: SqlOptions = {},
): string {
  return domainsToSql(bundle, options);
}
