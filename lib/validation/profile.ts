import { z } from "zod";

export const DISPLAY_NAME_MAX = 100;

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(DISPLAY_NAME_MAX, `Display name must be ${DISPLAY_NAME_MAX} characters or fewer`)
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"display_name", string[]>>;
};
