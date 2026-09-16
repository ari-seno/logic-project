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
