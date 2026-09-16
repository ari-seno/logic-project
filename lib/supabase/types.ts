export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export const REQUIREMENT_TYPES = [
  "functional",
  "non_functional",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const REQUIREMENT_STATUSES = [
  "draft",
  "approved",
  "rejected",
  "implemented",
] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

export const REQUIREMENT_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type RequirementPriority = (typeof REQUIREMENT_PRIORITIES)[number];

export type Requirement = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: RequirementType;
  status: RequirementStatus;
  priority: RequirementPriority;
  created_at: string;
  updated_at: string;
};

export const DECISION_STATUSES = [
  "proposed",
  "accepted",
  "superseded",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export type Decision = {
  id: string;
  project_id: string;
  title: string;
  context: string | null;
  decision: string;
  rationale: string | null;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
};

export type Domain = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Entity = {
  id: string;
  domain_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const ENTITY_DATA_TYPES = [
  "uuid",
  "string",
  "text",
  "integer",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "json",
] as const;
export type EntityDataType = (typeof ENTITY_DATA_TYPES)[number];

export type EntityAttribute = {
  id: string;
  entity_id: string;
  name: string;
  data_type: EntityDataType;
  is_required: boolean;
  is_primary_key: boolean;
  default_value: string | null;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export const RELATIONSHIP_TYPES = [
  "one_to_one",
  "one_to_many",
  "many_to_one",
  "many_to_many",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export type EntityRelationship = {
  id: string;
  project_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const ARCHITECTURE_COMPONENT_TYPES = [
  "frontend",
  "backend",
  "database",
  "authentication",
  "storage",
  "external_service",
  "infrastructure",
  "worker",
  "queue",
  "cache",
  "other",
] as const;
export type ArchitectureComponentType =
  (typeof ARCHITECTURE_COMPONENT_TYPES)[number];

export const ARCHITECTURE_TECHNOLOGY_CATEGORIES = [
  "language",
  "framework",
  "database",
  "authentication",
  "hosting",
  "infrastructure",
  "testing",
  "package",
  "external_service",
  "other",
] as const;
export type ArchitectureTechnologyCategory =
  (typeof ARCHITECTURE_TECHNOLOGY_CATEGORIES)[number];

export const ARCHITECTURE_DECISION_STATUSES = [
  "proposed",
  "accepted",
  "superseded",
] as const;
export type ArchitectureDecisionStatus =
  (typeof ARCHITECTURE_DECISION_STATUSES)[number];

export type ArchitectureComponent = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  type: ArchitectureComponentType;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ArchitectureTechnology = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  category: ArchitectureTechnologyCategory;
  created_at: string;
  updated_at: string;
};

export type ArchitectureDecision = {
  id: string;
  project_id: string;
  title: string;
  context: string | null;
  decision: string | null;
  rationale: string | null;
  status: ArchitectureDecisionStatus;
  created_at: string;
  updated_at: string;
};

export type ArchitectureComponentDependency = {
  id: string;
  project_id: string;
  source_component_id: string;
  target_component_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type Tables = {
  profiles: {
    Row: Profile;
    Insert: {
      id: string;
      email: string;
      display_name?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      email?: string;
      display_name?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  projects: {
    Row: Project;
    Insert: {
      id?: string;
      owner_id: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      owner_id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  requirements: {
    Row: Requirement;
    Insert: {
      id?: string;
      project_id: string;
      title: string;
      description?: string | null;
      type: RequirementType;
      status: RequirementStatus;
      priority: RequirementPriority;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      title?: string;
      description?: string | null;
      type?: RequirementType;
      status?: RequirementStatus;
      priority?: RequirementPriority;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  decisions: {
    Row: Decision;
    Insert: {
      id?: string;
      project_id: string;
      title: string;
      context?: string | null;
      decision: string;
      rationale?: string | null;
      status: DecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      title?: string;
      context?: string | null;
      decision?: string;
      rationale?: string | null;
      status?: DecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  domains: {
    Row: Domain;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  entities: {
    Row: Entity;
    Insert: {
      id?: string;
      domain_id: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      domain_id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  entity_attributes: {
    Row: EntityAttribute;
    Insert: {
      id?: string;
      entity_id: string;
      name: string;
      data_type: EntityDataType;
      is_required?: boolean;
      is_primary_key?: boolean;
      default_value?: string | null;
      description?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      entity_id?: string;
      name?: string;
      data_type?: EntityDataType;
      is_required?: boolean;
      is_primary_key?: boolean;
      default_value?: string | null;
      description?: string | null;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  entity_relationships: {
    Row: EntityRelationship;
    Insert: {
      id?: string;
      project_id: string;
      source_entity_id: string;
      target_entity_id: string;
      relationship_type: RelationshipType;
      name?: string | null;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      source_entity_id?: string;
      target_entity_id?: string;
      relationship_type?: RelationshipType;
      name?: string | null;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_components: {
    Row: ArchitectureComponent;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      type: ArchitectureComponentType;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      type?: ArchitectureComponentType;
      position?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_technologies: {
    Row: ArchitectureTechnology;
    Insert: {
      id?: string;
      project_id: string;
      name: string;
      description?: string | null;
      category: ArchitectureTechnologyCategory;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      name?: string;
      description?: string | null;
      category?: ArchitectureTechnologyCategory;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_decisions: {
    Row: ArchitectureDecision;
    Insert: {
      id?: string;
      project_id: string;
      title: string;
      context?: string | null;
      decision?: string | null;
      rationale?: string | null;
      status?: ArchitectureDecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      title?: string;
      context?: string | null;
      decision?: string | null;
      rationale?: string | null;
      status?: ArchitectureDecisionStatus;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
  architecture_component_dependencies: {
    Row: ArchitectureComponentDependency;
    Insert: {
      id?: string;
      project_id: string;
      source_component_id: string;
      target_component_id: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      project_id?: string;
      source_component_id?: string;
      target_component_id?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
};

export type Database = {
  public: {
    Tables: Tables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
