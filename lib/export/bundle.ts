import { listArchitectureComponentDependenciesByProject } from "@/lib/architecture/dependencies/queries";
import { listArchitectureComponentsByProject } from "@/lib/architecture/components/queries";
import { listArchitectureDecisionsByProject } from "@/lib/architecture/decisions/queries";
import { listArchitectureTechnologiesByProject } from "@/lib/architecture/technologies/queries";
import { loadProjectApiContract, type ProjectApiContract } from "@/lib/api/endpoints/queries";
import { listDecisions } from "@/lib/decisions/queries";
import { listDomains } from "@/lib/domains/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";
import { getProject } from "@/lib/projects/queries";
import { listRelationships } from "@/lib/relationships/queries";
import { listRequirements } from "@/lib/requirements/queries";
import { createClient } from "@/lib/supabase/server";
import { listTasksByProject } from "@/lib/tasks/queries";
import { listUiComponentsByProject } from "@/lib/ui/components/queries";
import { listUiNavigationItemsByProject } from "@/lib/ui/navigation/queries";
import { listUiScreensByProject } from "@/lib/ui/screens/queries";
import type {
  ArchitectureComponent,
  ArchitectureComponentDependency,
  ArchitectureDecision,
  ArchitectureTechnology,
  Decision,
  Domain,
  Entity,
  EntityAttribute,
  EntityRelationship,
  Project,
  Requirement,
  Task,
  TaskApiEndpointLink,
  TaskArchitectureComponentLink,
  TaskDecisionLink,
  TaskDependency,
  TaskDomainLink,
  TaskRequirementLink,
  TaskUiScreenLink,
  UiComponent,
  UiForm,
  UiFormField,
  UiInteraction,
  UiInteractionEndpoint,
  UiNavigationItem,
  UiScreen,
  UiScreenComponent,
  UiScreenEntity,
  UiScreenRequirement,
  UiState,
} from "@/lib/supabase/types";

export interface ProjectBundle {
  project: Project;
  requirements: Requirement[];
  decisions: Decision[];
  domains: Domain[];
  entities: Entity[];
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
  architecture: {
    components: ArchitectureComponent[];
    technologies: ArchitectureTechnology[];
    decisions: ArchitectureDecision[];
    dependencies: ArchitectureComponentDependency[];
  };
  api: ProjectApiContract;
  ui: {
    screens: UiScreen[];
    components: UiComponent[];
    screenComponents: UiScreenComponent[];
    forms: UiForm[];
    formFields: UiFormField[];
    states: UiState[];
    interactions: UiInteraction[];
    interactionEndpoints: UiInteractionEndpoint[];
    screenRequirements: UiScreenRequirement[];
    screenEntities: UiScreenEntity[];
    navigation: UiNavigationItem[];
  };
  tasks: Task[];
  taskDependencies: TaskDependency[];
  taskLinks: {
    requirements: TaskRequirementLink[];
    decisions: TaskDecisionLink[];
    domains: TaskDomainLink[];
    architectureComponents: TaskArchitectureComponentLink[];
    apiEndpoints: TaskApiEndpointLink[];
    uiScreens: TaskUiScreenLink[];
  };
}

async function selectIn<T>(
  table:
    | "entity_attributes"
    | "ui_screen_components"
    | "ui_forms"
    | "ui_states"
    | "ui_interactions"
    | "ui_screen_requirements"
    | "ui_screen_entities"
    | "ui_form_fields"
    | "ui_interaction_endpoints"
    | "task_requirements"
    | "task_decisions"
    | "task_domains"
    | "task_architecture_components"
    | "task_api_endpoints"
    | "task_ui_screens",
  column: string,
  ids: string[],
  orderBy?: string,
): Promise<T[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  let query = supabase.from(table).select("*").in(column, ids);
  if (orderBy) {
    query = query.order(orderBy, { ascending: true });
  }
  const { data, error } = await query;
  if (error) {
    console.error(`loadProjectBundle(${table}) failed:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export async function loadProjectBundle(
  projectId: string,
): Promise<ProjectBundle | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const [
    requirements,
    decisions,
    domains,
    entities,
    relationships,
    components,
    technologies,
    architectureDecisions,
    dependencies,
    api,
    screens,
    uiComponents,
    navigation,
    tasks,
  ] = await Promise.all([
    listRequirements({ projectId }),
    listDecisions({ projectId }),
    listDomains({ projectId }),
    listEntitiesByProject(projectId),
    listRelationships({ projectId }),
    listArchitectureComponentsByProject({ projectId }),
    listArchitectureTechnologiesByProject({ projectId }),
    listArchitectureDecisionsByProject({ projectId }),
    listArchitectureComponentDependenciesByProject({ projectId }),
    loadProjectApiContract(projectId),
    listUiScreensByProject({ projectId }),
    listUiComponentsByProject({ projectId }),
    listUiNavigationItemsByProject({ projectId }),
    listTasksByProject({ projectId }),
  ]);

  const entityIds = entities.map((e) => e.id);
  const screenIds = screens.map((s) => s.id);
  const taskIds = tasks.map((t) => t.id);

  const [
    attributes,
    screenComponents,
    forms,
    states,
    interactions,
    screenRequirements,
    screenEntities,
    taskRequirements,
    taskDecisions,
    taskDomains,
    taskArchitectureComponents,
    taskApiEndpoints,
    taskUiScreens,
  ] = await Promise.all([
    selectIn<EntityAttribute>("entity_attributes", "entity_id", entityIds, "position"),
    selectIn<UiScreenComponent>("ui_screen_components", "screen_id", screenIds, "position"),
    selectIn<UiForm>("ui_forms", "screen_id", screenIds),
    selectIn<UiState>("ui_states", "screen_id", screenIds),
    selectIn<UiInteraction>("ui_interactions", "screen_id", screenIds),
    selectIn<UiScreenRequirement>("ui_screen_requirements", "screen_id", screenIds),
    selectIn<UiScreenEntity>("ui_screen_entities", "screen_id", screenIds),
    selectIn<TaskRequirementLink>("task_requirements", "task_id", taskIds),
    selectIn<TaskDecisionLink>("task_decisions", "task_id", taskIds),
    selectIn<TaskDomainLink>("task_domains", "task_id", taskIds),
    selectIn<TaskArchitectureComponentLink>(
      "task_architecture_components",
      "task_id",
      taskIds,
    ),
    selectIn<TaskApiEndpointLink>("task_api_endpoints", "task_id", taskIds),
    selectIn<TaskUiScreenLink>("task_ui_screens", "task_id", taskIds),
  ]);

  const formIds = forms.map((f) => f.id);
  const interactionIds = interactions.map((i) => i.id);

  const supabase = await createClient();

  const [formFields, interactionEndpoints, taskDependenciesResult] =
    await Promise.all([
      selectIn<UiFormField>("ui_form_fields", "form_id", formIds, "position"),
      selectIn<UiInteractionEndpoint>(
        "ui_interaction_endpoints",
        "interaction_id",
        interactionIds,
      ),
      supabase
        .from("task_dependencies")
        .select("*")
        .eq("project_id", projectId),
    ]);

  if (taskDependenciesResult.error) {
    console.error(
      "loadProjectBundle(task_dependencies) failed:",
      taskDependenciesResult.error.message,
    );
  }
  const taskDependencies = (taskDependenciesResult.data ?? []) as TaskDependency[];

  return {
    project,
    requirements,
    decisions,
    domains,
    entities,
    attributes,
    relationships,
    architecture: {
      components,
      technologies,
      decisions: architectureDecisions,
      dependencies,
    },
    api,
    ui: {
      screens,
      components: uiComponents,
      screenComponents,
      forms,
      formFields,
      states,
      interactions,
      interactionEndpoints,
      screenRequirements,
      screenEntities,
      navigation,
    },
    tasks,
    taskDependencies,
    taskLinks: {
      requirements: taskRequirements,
      decisions: taskDecisions,
      domains: taskDomains,
      architectureComponents: taskArchitectureComponents,
      apiEndpoints: taskApiEndpoints,
      uiScreens: taskUiScreens,
    },
  };
}
