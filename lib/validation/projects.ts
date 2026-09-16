import { z } from "zod";

export const projectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export const projectUpdateSchema = projectInputSchema;

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export type ProjectActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "description", string[]>>;
};
