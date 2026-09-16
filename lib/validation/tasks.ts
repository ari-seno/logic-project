import { z } from "zod";

import {
  TASK_DEPENDENCY_TYPES,
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "@/lib/supabase/types";

const TITLE_MAX = 200;

const titleField = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer`);

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

const acceptanceCriteriaField = z
  .string()
  .trim()
  .max(10000, "Acceptance criteria must be 10000 characters or fewer")
  .optional()
  .or(z.literal(""));

const implementationNotesField = z
  .string()
  .trim()
  .max(10000, "Implementation notes must be 10000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const taskTypeField = z.enum(
  TASK_TYPES as unknown as [string, ...string[]],
);
export const taskStatusField = z.enum(
  TASK_STATUSES as unknown as [string, ...string[]],
);
export const taskPriorityField = z.enum(
  TASK_PRIORITIES as unknown as [string, ...string[]],
);
export const taskEffortField = z.enum(
  TASK_EFFORTS as unknown as [string, ...string[]],
);

export const taskInputSchema = z.object({
  title: titleField,
  description: descriptionField,
  task_type: taskTypeField,
  status: taskStatusField.optional().default("todo"),
  priority: taskPriorityField.optional().default("medium"),
  estimated_effort: taskEffortField.optional().or(z.literal("")),
  acceptance_criteria: acceptanceCriteriaField,
  implementation_notes: implementationNotesField,
  parent_task_id: z.string().uuid("Invalid parent").optional().or(z.literal("")),
});

export const taskUpdateSchema = taskInputSchema;

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export type TaskActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "title"
      | "description"
      | "task_type"
      | "status"
      | "priority"
      | "estimated_effort"
      | "acceptance_criteria"
      | "implementation_notes"
      | "parent_task_id",
      string[]
    >
  >;
};

export const taskDependencyTypeField = z.enum(
  TASK_DEPENDENCY_TYPES as unknown as [string, ...string[]],
);

const dependencyDescriptionField = z
  .string()
  .trim()
  .max(2000, "Description must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const taskDependencyInputSchema = z.object({
  depends_on_task_id: z.string().uuid("Invalid task"),
  dependency_type: taskDependencyTypeField.optional().default("blocks"),
  description: dependencyDescriptionField,
});

export type TaskDependencyInput = z.infer<typeof taskDependencyInputSchema>;

export type TaskDependencyActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"depends_on_task_id" | "dependency_type" | "description", string[]>
  >;
};
