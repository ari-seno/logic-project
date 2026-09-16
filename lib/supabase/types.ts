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
