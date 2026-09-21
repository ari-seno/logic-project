import type { ProjectBundle } from "@/lib/export/bundle";
import { slugify } from "@/lib/utils";

export interface BundleJsonOptions {
  generatedAt?: string;
}

export function projectToJson(
  bundle: ProjectBundle,
  options: BundleJsonOptions = {},
): Record<string, unknown> {
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
  const entityById = new Map(entities.map((e) => [e.id, e]));
  const domainById = new Map(domains.map((d) => [d.id, d]));
  const componentById = new Map(architecture.components.map((c) => [c.id, c]));
  const screenById = new Map(ui.screens.map((s) => [s.id, s]));
  const uiComponentById = new Map(ui.components.map((c) => [c.id, c]));
  const requirementById = new Map(requirements.map((r) => [r.id, r]));
  const decisionById = new Map(decisions.map((d) => [d.id, d]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const apiEndpointById = new Map(api.endpoints.map((e) => [e.id, e]));

  const attributesByEntity = new Map<string, typeof attributes>();
  for (const a of attributes) {
    const list = attributesByEntity.get(a.entity_id) ?? [];
    list.push(a);
    attributesByEntity.set(a.entity_id, list);
  }

  const entityPayload = (entity: (typeof entities)[number]) => ({
    id: entity.id,
    name: entity.name,
    description: entity.description,
    attributes: (attributesByEntity.get(entity.id) ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((a) => ({
        id: a.id,
        name: a.name,
        data_type: a.data_type,
        required: a.is_required,
        primary_key: a.is_primary_key,
        default_value: a.default_value,
        description: a.description,
      })),
  });

  const domainPayload: Array<{
    id: string | null;
    name: string | null;
    description: string | null;
    entities: ReturnType<typeof entityPayload>[];
  }> = domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    description: domain.description,
    entities: entities
      .filter((e) => e.domain_id === domain.id)
      .map(entityPayload),
  }));

  const orphanEntities = entities.filter((e) => !domainById.has(e.domain_id));
  if (orphanEntities.length > 0) {
    domainPayload.push({
      id: null,
      name: null,
      description: null,
      entities: orphanEntities.map(entityPayload),
    });
  }

  const relationshipPayload = relationships.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.relationship_type,
    description: r.description,
    source: {
      id: r.source_entity_id,
      name: entityById.get(r.source_entity_id)?.name ?? null,
    },
    target: {
      id: r.target_entity_id,
      name: entityById.get(r.target_entity_id)?.name ?? null,
    },
  }));

  const apiPayload = {
    groups: api.groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      prefix: g.prefix,
      position: g.position,
    })),
    endpoints: api.endpoints.map((ep) => ({
      id: ep.id,
      name: ep.name,
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
      description: ep.description,
      authentication_required: ep.authentication_required,
      group: ep.group_id
        ? {
            id: ep.group_id,
            name: api.groups.find((g) => g.id === ep.group_id)?.name ?? null,
          }
        : null,
      parameters: api.parameters
        .filter((p) => p.endpoint_id === ep.id)
        .sort((a, b) => a.position - b.position)
        .map((p) => ({
          name: p.name,
          location: p.location,
          data_type: p.data_type,
          required: p.required,
          description: p.description,
          example: p.example,
        })),
      request_body:
        api.requestBodies
          .filter((b) => b.endpoint_id === ep.id)
          .map((b) => ({
            content_type: b.content_type,
            description: b.description,
            schema: b.schema_definition,
            example: b.example,
          }))[0] ?? null,
      responses: api.responses
        .filter((r) => r.endpoint_id === ep.id)
        .sort((a, b) => a.status_code - b.status_code)
        .map((r) => ({
          status_code: r.status_code,
          description: r.description,
          content_type: r.content_type,
          schema: r.schema_definition,
          example: r.example,
        })),
      errors: api.errors
        .filter((e) => e.endpoint_id === ep.id)
        .map((e) => ({
          code: e.code,
          message: e.message,
          http_status: e.http_status,
          description: e.description,
        })),
      traceability: {
        entities: api.endpointEntities
          .filter((l) => l.endpoint_id === ep.id)
          .map((l) => ({
            id: l.entity_id,
            name: l.entity_name,
            domain: l.domain_name,
            role: l.role,
          })),
        requirements: api.endpointRequirements
          .filter((l) => l.endpoint_id === ep.id)
          .map((l) => ({
            id: l.requirement_id,
            title: l.requirement_title,
            status: l.requirement_status,
          })),
      },
    })),
  };

  const uiPayload = {
    screens: ui.screens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      route: screen.route,
      screen_type: screen.screen_type,
      purpose: screen.purpose,
      description: screen.description,
      authentication_required: screen.authentication_required,
      components: ui.screenComponents
        .filter((sc) => sc.screen_id === screen.id)
        .sort((a, b) => a.position - b.position)
        .map((sc) => ({
          id: sc.component_id,
          name: uiComponentById.get(sc.component_id)?.name ?? null,
          type: uiComponentById.get(sc.component_id)?.component_type ?? null,
          label: sc.label,
          required: sc.required,
        })),
      forms: ui.forms
        .filter((f) => f.screen_id === screen.id)
        .map((f) => ({
          name: f.name,
          description: f.description,
          submit_label: f.submit_label,
          success_behavior: f.success_behavior,
          fields: ui.formFields
            .filter((ff) => ff.form_id === f.id)
            .sort((a, b) => a.position - b.position)
            .map((ff) => ({
              name: ff.name,
              label: ff.label,
              field_type: ff.field_type,
              required: ff.required,
              placeholder: ff.placeholder,
              help_text: ff.help_text,
              default_value: ff.default_value,
            })),
        })),
      states: ui.states
        .filter((st) => st.screen_id === screen.id)
        .map((st) => ({
          name: st.name,
          state_type: st.state_type,
          description: st.description,
          behavior: st.behavior,
        })),
      interactions: ui.interactions
        .filter((i) => i.screen_id === screen.id)
        .map((i) => ({
          name: i.name,
          trigger: i.trigger,
          action: i.action,
          description: i.description,
          endpoints: ui.interactionEndpoints
            .filter((ie) => ie.interaction_id === i.id)
            .map((ie) => ({
              id: ie.endpoint_id,
              name: apiEndpointById.get(ie.endpoint_id)?.name ?? null,
              method: apiEndpointById.get(ie.endpoint_id)?.method ?? null,
              path: apiEndpointById.get(ie.endpoint_id)?.path ?? null,
            })),
        })),
      requirements: ui.screenRequirements
        .filter((l) => l.screen_id === screen.id)
        .map((l) => ({
          id: l.requirement_id,
          title: requirementById.get(l.requirement_id)?.title ?? null,
        })),
      entities: ui.screenEntities
        .filter((l) => l.screen_id === screen.id)
        .map((l) => ({
          id: l.entity_id,
          name: entityById.get(l.entity_id)?.name ?? null,
          role: l.role,
        })),
    })),
    components: ui.components.map((c) => ({
      id: c.id,
      name: c.name,
      component_type: c.component_type,
      description: c.description,
      purpose: c.purpose,
      technology: c.technology,
    })),
    navigation: ui.navigation.map((n) => ({
      id: n.id,
      name: n.name,
      label: n.label,
      route: n.route,
      description: n.description,
      parent_id: n.parent_id,
    })),
  };

  const taskPayload = tasks.map((task) => {
    const trace = {
      requirements: taskLinks.requirements
        .filter((l) => l.task_id === task.id)
        .map((l) => ({
          id: l.requirement_id,
          title: requirementById.get(l.requirement_id)?.title ?? null,
        })),
      decisions: taskLinks.decisions
        .filter((l) => l.task_id === task.id)
        .map((l) => ({
          id: l.decision_id,
          title: decisionById.get(l.decision_id)?.title ?? null,
        })),
      entities: taskLinks.domains
        .filter((l) => l.task_id === task.id)
        .map((l) => ({
          id: l.entity_id,
          name: entityById.get(l.entity_id)?.name ?? null,
        })),
      architecture_components: taskLinks.architectureComponents
        .filter((l) => l.task_id === task.id)
        .map((l) => ({
          id: l.component_id,
          name: componentById.get(l.component_id)?.name ?? null,
        })),
      api_endpoints: taskLinks.apiEndpoints
        .filter((l) => l.task_id === task.id)
        .map((l) => ({
          id: l.endpoint_id,
          name: apiEndpointById.get(l.endpoint_id)?.name ?? null,
          method: apiEndpointById.get(l.endpoint_id)?.method ?? null,
          path: apiEndpointById.get(l.endpoint_id)?.path ?? null,
        })),
      ui_screens: taskLinks.uiScreens
        .filter((l) => l.task_id === task.id)
        .map((l) => ({
          id: l.screen_id,
          name: screenById.get(l.screen_id)?.name ?? null,
        })),
    };

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      status: task.status,
      priority: task.priority,
      estimated_effort: task.estimated_effort,
      acceptance_criteria: task.acceptance_criteria,
      implementation_notes: task.implementation_notes,
      parent: task.parent_task_id
        ? {
            id: task.parent_task_id,
            title: taskById.get(task.parent_task_id)?.title ?? null,
          }
        : null,
      traceability: trace,
    };
  });

  const summary = {
    requirements: requirements.length,
    decisions: decisions.length,
    domains: domains.length,
    entities: entities.length,
    attributes: attributes.length,
    relationships: relationships.length,
    architecture_components: architecture.components.length,
    architecture_technologies: architecture.technologies.length,
    architecture_decisions: architecture.decisions.length,
    architecture_dependencies: architecture.dependencies.length,
    api_groups: api.groups.length,
    api_endpoints: api.endpoints.length,
    ui_screens: ui.screens.length,
    ui_components: ui.components.length,
    tasks: tasks.length,
  };

  return {
    generator: "logic-project",
    schema_version: 1,
    generated_at: generatedAt,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      created_at: project.created_at,
      updated_at: project.updated_at,
    },
    summary,
    requirements: requirements.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      status: r.status,
      priority: r.priority,
    })),
    decisions: decisions.map((d) => ({
      id: d.id,
      title: d.title,
      context: d.context,
      decision: d.decision,
      rationale: d.rationale,
      status: d.status,
    })),
    domain: {
      domains: domainPayload,
      relationships: relationshipPayload,
    },
    architecture: {
      components: architecture.components.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        dependencies: architecture.dependencies
          .filter((dep) => dep.source_component_id === c.id)
          .map((dep) => ({
            id: dep.target_component_id,
            name: componentById.get(dep.target_component_id)?.name ?? null,
            description: dep.description,
          })),
      })),
      technologies: architecture.technologies.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
      })),
      decisions: architecture.decisions.map((d) => ({
        id: d.id,
        title: d.title,
        context: d.context,
        decision: d.decision,
        rationale: d.rationale,
        status: d.status,
      })),
      dependencies: architecture.dependencies.map((dep) => ({
        source: {
          id: dep.source_component_id,
          name: componentById.get(dep.source_component_id)?.name ?? null,
        },
        target: {
          id: dep.target_component_id,
          name: componentById.get(dep.target_component_id)?.name ?? null,
        },
        description: dep.description,
      })),
    },
    api: apiPayload,
    ui: uiPayload,
    tasks: taskPayload,
    task_dependencies: taskDependencies.map((d) => ({
      task: {
        id: d.task_id,
        title: taskById.get(d.task_id)?.title ?? null,
      },
      depends_on: {
        id: d.depends_on_task_id,
        title: taskById.get(d.depends_on_task_id)?.title ?? null,
      },
      type: d.dependency_type,
      description: d.description,
    })),
  };
}

export function serializeProjectJson(
  bundle: ProjectBundle,
  options: BundleJsonOptions = {},
): string {
  return JSON.stringify(projectToJson(bundle, options), null, 2);
}

export function projectJsonFilename(projectName: string): string {
  return `${slugify(projectName, "project")}.json`;
}
