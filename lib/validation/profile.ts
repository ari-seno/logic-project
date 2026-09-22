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

export const ACCOUNT_PURGE_GRACE_DAYS = 30;

export const accountDeletionSchema = z.object({
  confirmEmail: z
    .string()
    .trim()
    .min(1, "Type your email address to confirm")
    .email("Enter a valid email address"),
});

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;

export type AccountDeletionActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"confirmEmail", string[]>>;
};
