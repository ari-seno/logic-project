import { z } from "zod";

const emailField = z.string().min(1, "Email is required").email("Invalid email address");
const passwordField = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password is too long");

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type AuthActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string[]>>;
};
