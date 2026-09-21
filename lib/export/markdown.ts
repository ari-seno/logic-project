import type { ProjectBundle } from "@/lib/export/bundle";

export interface MarkdownOptions {
  generatedAt?: string;
}

function cell(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return value.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function text(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return value.trim();
}

function joinBlocks(blocks: Array<string | null | undefined | false>): string {
  return blocks
    .filter((b): b is string => Boolean(b && b.trim()))
    .join("\n");
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "";
  const head = `| ${headers.map(cell).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

export function projectToMarkdown(
  bundle: ProjectBundle,
  options: MarkdownOptions = {},
): string {
  const {
    project,
    requirements,
    decisions,
    domains,
    entities,
    attributes,
    relationships,
    architecture,
    api,
    ui,
    tasks,
    taskDependencies,
    taskLinks,
  } = bundle;

  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const entityNameById = new Map(entities.map((e) => [e.id, e.name]));
  const componentNameById = new Map(
    architecture.components.map((c) => [c.id, c.name]),
  );
  const screenNameById = new Map(ui.screens.map((s) => [s.id, s.name]));
  const taskTitleById = new Map(tasks.map((t) => [t.id, t.title]));
  const requirementTitleById = new Map(
    requirements.map((r) => [r.id, r.title]),
  );
  const decisionTitleById = new Map(decisions.map((d) => [d.id, d.title]));

  const sections: Array<{ title: string; body: string }> = [];

  // Requirements
  if (requirements.length > 0) {
    const group = (type: "functional" | "non_functional") =>
      requirements.filter((r) => r.type === type);
    const renderList = (items: typeof requirements) =>
      items
        .map((r) =>
          joinBlocks([
            `#### ${r.title}`,
            `\`${r.priority}\` · \`${r.status}\` · \`${r.type}\``,
            text(r.description),
          ]),
        )
        .join("\n\n");

    const functional = group("functional");
    const nonFunctional = group("non_functional");
    sections.push({
      title: "Requirements",
      body: joinBlocks([
        functional.length ? "### Functional\n\n" + renderList(functional) : "",
        nonFunctional.length
          ? "### Non-functional\n\n" + renderList(nonFunctional)
          : "",
      ]),
    });
  }

  // Decisions
  if (decisions.length > 0) {
    sections.push({
      title: "Decisions",
      body: decisions
        .map((d) =>
          joinBlocks([
            `### ${d.title}`,
            `\`${d.status}\``,
            text(d.context) ? `**Context:** ${text(d.context)}` : "",
            text(d.decision) ? `**Decision:** ${text(d.decision)}` : "",
            text(d.rationale) ? `**Rationale:** ${text(d.rationale)}` : "",
          ]),
        )
        .join("\n\n"),
    });
  }

  // Domain model
  if (domains.length > 0 || entities.length > 0 || relationships.length > 0) {
    const domainBlocks = domains.map((d) => {
      const domainEntities = entities.filter((e) => e.domain_id === d.id);
      const entityBlocks = domainEntities.map((e) => {
        const rows = attributes
          .filter((a) => a.entity_id === e.id)
          .map((a) => [
            a.name,
            a.data_type,
            a.is_required ? "yes" : "no",
            a.is_primary_key ? "yes" : "no",
            a.default_value ?? "",
            a.description ?? "",
          ]);
        return joinBlocks([
          `#### ${e.name}`,
          text(e.description),
          table(
            ["Attribute", "Type", "Required", "PK", "Default", "Description"],
            rows,
          ),
        ]);
      });
      return joinBlocks([
        `### ${d.name}`,
        text(d.description),
        ...entityBlocks,
      ]);
    });

    const orphanEntities = entities.filter(
      (e) => !domains.some((d) => d.id === e.domain_id),
    );
    const orphanBlock =
      orphanEntities.length > 0
        ? joinBlocks([
            "### (no domain)",
            ...orphanEntities.map((e) => {
              const rows = attributes
                .filter((a) => a.entity_id === e.id)
                .map((a) => [
                  a.name,
                  a.data_type,
                  a.is_required ? "yes" : "no",
                  a.is_primary_key ? "yes" : "no",
                  a.default_value ?? "",
                  a.description ?? "",
                ]);
              return joinBlocks([
                `#### ${e.name}`,
                text(e.description),
                table(
                  [
                    "Attribute",
                    "Type",
                    "Required",
                    "PK",
                    "Default",
                    "Description",
                  ],
                  rows,
                ),
              ]);
            }),
          ])
        : "";

    const relationshipBlock =
      relationships.length > 0
        ? joinBlocks([
            "### Relationships",
            table(
              ["Name", "From", "To", "Type", "Description"],
              relationships.map((r) => [
                r.name ?? "",
                entityNameById.get(r.source_entity_id) ?? r.source_entity_id,
                entityNameById.get(r.target_entity_id) ?? r.target_entity_id,
                r.relationship_type,
                r.description ?? "",
              ]),
            ),
          ])
        : "";

    sections.push({
      title: "Domain model",
      body: joinBlocks([...domainBlocks, orphanBlock, relationshipBlock]),
    });
  }

  // Architecture
  if (
    architecture.components.length > 0 ||
    architecture.technologies.length > 0 ||
    architecture.decisions.length > 0 ||
    architecture.dependencies.length > 0
  ) {
    const componentBlock =
      architecture.components.length > 0
        ? joinBlocks([
            "### Components",
            table(
              ["Component", "Type", "Description"],
              architecture.components.map((c) => [
                c.name,
                c.type ?? "",
                c.description ?? "",
              ]),
            ),
          ])
        : "";

    const dependencyBlock =
      architecture.dependencies.length > 0
        ? joinBlocks([
            "### Dependencies",
            table(
              ["From", "To", "Description"],
              architecture.dependencies.map((d) => [
                componentNameById.get(d.source_component_id) ??
                  d.source_component_id,
                componentNameById.get(d.target_component_id) ??
                  d.target_component_id,
                d.description ?? "",
              ]),
            ),
          ])
        : "";

    const technologyBlock =
      architecture.technologies.length > 0
        ? joinBlocks([
            "### Technologies",
            table(
              ["Technology", "Category", "Description"],
              architecture.technologies.map((t) => [
                t.name,
                t.category ?? "",
                t.description ?? "",
              ]),
            ),
          ])
        : "";

    const architectureDecisionBlock =
      architecture.decisions.length > 0
        ? joinBlocks([
            "### Architecture decisions",
            ...architecture.decisions.map((d) =>
              joinBlocks([
                `#### ${d.title}`,
                `\`${d.status}\``,
                text(d.context) ? `**Context:** ${text(d.context)}` : "",
                text(d.decision) ? `**Decision:** ${text(d.decision)}` : "",
                text(d.rationale) ? `**Rationale:** ${text(d.rationale)}` : "",
              ]),
            ),
          ])
        : "";

    sections.push({
      title: "Architecture",
      body: joinBlocks([
        componentBlock,
        dependencyBlock,
        technologyBlock,
        architectureDecisionBlock,
      ]),
    });
  }

  // API
  if (api.endpoints.length > 0) {
    const groupNameById = new Map(api.groups.map((g) => [g.id, g.name]));
    const endpointBlocks = api.endpoints.map((ep) => {
      const params = api.parameters
        .filter((p) => p.endpoint_id === ep.id)
        .sort((a, b) => a.position - b.position);
      const body = api.requestBodies.find((b) => b.endpoint_id === ep.id);
      const responses = api.responses
        .filter((r) => r.endpoint_id === ep.id)
        .sort((a, b) => a.status_code - b.status_code);
      const errors = api.errors.filter((e) => e.endpoint_id === ep.id);
      const entitiesFor = api.endpointEntities.filter(
        (l) => l.endpoint_id === ep.id,
      );
      const requirementsFor = api.endpointRequirements.filter(
        (l) => l.endpoint_id === ep.id,
      );
      const groupName = ep.group_id ? groupNameById.get(ep.group_id) : null;

      return joinBlocks([
        `### \`${ep.method} ${ep.path}\``,
        [
          ep.name,
          groupName ? `group: ${groupName}` : "",
          ep.authentication_required ? "auth: required" : "auth: public",
        ]
          .filter(Boolean)
          .join(" · "),
        text(ep.summary),
        text(ep.description),
        params.length > 0
          ? joinBlocks([
              "**Parameters**",
              table(
                ["Name", "In", "Type", "Required", "Description"],
                params.map((p) => [
                  p.name,
                  p.location,
                  p.data_type,
                  p.required ? "yes" : "no",
                  p.description ?? "",
                ]),
              ),
            ])
          : "",
        body
          ? joinBlocks([
              "**Request body**",
              `\`${body.content_type}\``,
              text(body.description),
              body.schema_definition
                ? "```json\n" +
                  JSON.stringify(body.schema_definition, null, 2) +
                  "\n```"
                : "",
            ])
          : "",
        responses.length > 0
          ? joinBlocks([
              "**Responses**",
              table(
                ["Status", "Content type", "Description"],
                responses.map((r) => [
                  String(r.status_code),
                  r.content_type ?? "",
                  r.description ?? "",
                ]),
              ),
            ])
          : "",
        errors.length > 0
          ? joinBlocks([
              "**Errors**",
              table(
                ["Code", "HTTP", "Message"],
                errors.map((e) => [
                  e.code,
                  e.http_status ? String(e.http_status) : "",
                  e.message,
                ]),
              ),
            ])
          : "",
        entitiesFor.length > 0
          ? `**Entities:** ${entitiesFor
              .map((l) => l.entity_name)
              .filter(Boolean)
              .join(", ")}`
          : "",
        requirementsFor.length > 0
          ? `**Requirements:** ${requirementsFor
              .map((l) => l.requirement_title)
              .filter(Boolean)
              .join(", ")}`
          : "",
      ]);
    });

    sections.push({ title: "API", body: endpointBlocks.join("\n\n") });
  }

  // UI
  if (ui.screens.length > 0 || ui.components.length > 0) {
    const screenBlocks = ui.screens.map((s) => {
      const placements = ui.screenComponents
        .filter((sc) => sc.screen_id === s.id)
        .sort((a, b) => a.position - b.position);
      const screenForms = ui.forms.filter((f) => f.screen_id === s.id);
      const states = ui.states.filter((st) => st.screen_id === s.id);
      const interactions = ui.interactions.filter((i) => i.screen_id === s.id);
      const screenReqs = ui.screenRequirements.filter(
        (l) => l.screen_id === s.id,
      );
      const screenEnts = ui.screenEntities.filter((l) => l.screen_id === s.id);
      const componentNameById = new Map(
        ui.components.map((c) => [c.id, c.name]),
      );

      return joinBlocks([
        `### ${s.name}`,
        [`\`${s.route}\``, s.screen_type, s.authentication_required ? "auth: required" : "auth: public"]
          .filter(Boolean)
          .join(" · "),
        text(s.purpose),
        text(s.description),
        placements.length > 0
          ? joinBlocks([
              "**Components**",
              table(
                ["Component", "Label", "Required"],
                placements.map((p) => [
                  componentNameById.get(p.component_id) ?? p.component_id,
                  p.label ?? "",
                  p.required ? "yes" : "no",
                ]),
              ),
            ])
          : "",
        screenForms.length > 0
          ? joinBlocks([
              "**Forms**",
              ...screenForms.map((f) => {
                const fields = ui.formFields
                  .filter((ff) => ff.form_id === f.id)
                  .sort((a, b) => a.position - b.position);
                return joinBlocks([
                  `- **${f.name}**${f.submit_label ? ` (submit: ${f.submit_label})` : ""}`,
                  text(f.description) ? `  ${text(f.description)}` : "",
                  fields.length > 0
                    ? table(
                        ["Field", "Type", "Required"],
                        fields.map((ff) => [
                          ff.label,
                          ff.field_type,
                          ff.required ? "yes" : "no",
                        ]),
                      )
                    : "",
                ]);
              }),
            ])
          : "",
        states.length > 0
          ? joinBlocks([
              "**States**",
              table(
                ["State", "Type", "Description"],
                states.map((st) => [
                  st.name,
                  st.state_type,
                  st.description ?? "",
                ]),
              ),
            ])
          : "",
        interactions.length > 0
          ? joinBlocks([
              "**Interactions**",
              table(
                ["Interaction", "Trigger", "Action"],
                interactions.map((i) => [
                  i.name,
                  i.trigger ?? "",
                  i.action ?? "",
                ]),
              ),
            ])
          : "",
        screenReqs.length > 0
          ? `**Requirements:** ${screenReqs
              .map((l) => requirementTitleById.get(l.requirement_id))
              .filter(Boolean)
              .join(", ")}`
          : "",
        screenEnts.length > 0
          ? `**Entities:** ${screenEnts
              .map((l) => entityNameById.get(l.entity_id))
              .filter(Boolean)
              .join(", ")}`
          : "",
      ]);
    });

    const componentLibBlock =
      ui.components.length > 0
        ? joinBlocks([
            "### Component library",
            table(
              ["Component", "Type", "Technology", "Purpose"],
              ui.components.map((c) => [
                c.name,
                c.component_type ?? "",
                c.technology ?? "",
                c.purpose ?? "",
              ]),
            ),
          ])
        : "";

    const navBlock =
      ui.navigation.length > 0
        ? joinBlocks([
            "### Navigation",
            table(
              ["Label", "Route", "Description"],
              ui.navigation.map((n) => [
                n.label,
                n.route ?? "",
                n.description ?? "",
              ]),
            ),
          ])
        : "";

    sections.push({
      title: "UI",
      body: joinBlocks([...screenBlocks, componentLibBlock, navBlock]),
    });
  }

  // Tasks
  if (tasks.length > 0) {
    const renderTask = (taskId: string, depth: number): string => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return "";
      const indent = "  ".repeat(depth);
      const links = taskLinks;
      const trace: string[] = [];
      const reqs = links.requirements
        .filter((l) => l.task_id === taskId)
        .map((l) => requirementTitleById.get(l.requirement_id))
        .filter(Boolean);
      if (reqs.length) trace.push(`req: ${reqs.join(", ")}`);
      const decs = links.decisions
        .filter((l) => l.task_id === taskId)
        .map((l) => decisionTitleById.get(l.decision_id))
        .filter(Boolean);
      if (decs.length) trace.push(`decision: ${decs.join(", ")}`);
      const ents = links.domains
        .filter((l) => l.task_id === taskId)
        .map((l) => entityNameById.get(l.entity_id))
        .filter(Boolean);
      if (ents.length) trace.push(`entity: ${ents.join(", ")}`);
      const comps = links.architectureComponents
        .filter((l) => l.task_id === taskId)
        .map((l) => componentNameById.get(l.component_id))
        .filter(Boolean);
      if (comps.length) trace.push(`component: ${comps.join(", ")}`);
      const eps = links.apiEndpoints
        .filter((l) => l.task_id === taskId)
        .map((l) => l.endpoint_id)
        .filter(Boolean);
      if (eps.length) trace.push(`endpoint: ${eps.join(", ")}`);
      const screens = links.uiScreens
        .filter((l) => l.task_id === taskId)
        .map((l) => screenNameById.get(l.screen_id))
        .filter(Boolean);
      if (screens.length) trace.push(`screen: ${screens.join(", ")}`);

      const children = tasks.filter((t) => t.parent_task_id === taskId);
      const lines = [
        `${indent}- [${task.status === "done" ? "x" : " "}] ${task.title} \`${task.status}\` · \`${task.priority}\`${task.task_type ? ` · \`${task.task_type}\`` : ""}`,
        text(task.description)
          ? `${indent}  ${text(task.description)}`
          : "",
        text(task.acceptance_criteria)
          ? `${indent}  **Acceptance:** ${text(task.acceptance_criteria)}`
          : "",
        trace.length ? `${indent}  **Traceability:** ${trace.join("; ")}` : "",
        ...children.map((c) => renderTask(c.id, depth + 1)),
      ];
      return lines.filter(Boolean).join("\n");
    };

    const topLevel = tasks.filter((t) => !t.parent_task_id);
    const dependencyBlock =
      taskDependencies.length > 0
        ? joinBlocks([
            "### Task dependencies",
            table(
              ["Task", "Depends on", "Type"],
              taskDependencies.map((d) => [
                taskTitleById.get(d.task_id) ?? d.task_id,
                taskTitleById.get(d.depends_on_task_id) ?? d.depends_on_task_id,
                d.dependency_type,
              ]),
            ),
          ])
        : "";

    sections.push({
      title: "Tasks",
      body: joinBlocks([
        topLevel.map((t) => renderTask(t.id, 0)).join("\n"),
        dependencyBlock,
      ]),
    });
  }

  const overview = joinBlocks([
    text(project.description),
    `_Generated ${generatedAt} by Logic Project._`,
  ]);

  const toc = sections.length
    ? sections
        .map((s) => `- [${s.title}](#${s.title.toLowerCase().replace(/\s+/g, "-")})`)
        .join("\n")
    : "";

  const body = sections
    .map((s) => `## ${s.title}\n\n${s.body}`)
    .join("\n\n");

  return joinBlocks([
    `# ${project.name}`,
    overview,
    toc ? `## Contents\n\n${toc}` : "",
    body,
  ]).trim() + "\n";
}
