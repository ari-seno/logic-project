import { z } from "zod";

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const architectureComponentDependencyInputSchema = z.object({
  source_component_id: z
    .string()
    .uuid("Source component is required"),
  target_component_id: z
    .string()
    .uuid("Target component is required"),
  description: descriptionField,
});

export const architectureComponentDependencyUpdateSchema =
  architectureComponentDependencyInputSchema;

export type ArchitectureComponentDependencyInput = z.infer<
  typeof architectureComponentDependencyInputSchema
>;
export type ArchitectureComponentDependencyUpdateInput = z.infer<
  typeof architectureComponentDependencyUpdateSchema
>;

export type ArchitectureComponentDependencyActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"source_component_id" | "target_component_id" | "description", string[]>
  >;
};
