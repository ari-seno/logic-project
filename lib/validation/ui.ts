import { z } from "zod";

import {
  UI_COMPONENT_TYPES,
  UI_FIELD_TYPES,
  UI_SCREEN_ENTITY_ROLES,
  UI_SCREEN_TYPES,
  UI_STATE_TYPES,
} from "@/lib/supabase/types";

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be 200 characters or fewer");

const labelField = z
  .string()
  .trim()
  .min(1, "Label is required")
  .max(200, "Label must be 200 characters or fewer");

const routeField = z
  .string()
  .trim()
  .max(500, "Route must be 500 characters or fewer")
  .optional()
  .or(z.literal(""));

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

const purposeField = z
  .string()
  .trim()
  .max(2000, "Purpose must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const uiScreenTypeField = z.enum(
  UI_SCREEN_TYPES as unknown as [string, ...string[]],
);

export const uiScreenInputSchema = z.object({
  name: nameField,
  route: routeField,
  screen_type: uiScreenTypeField,
  description: descriptionField,
  purpose: purposeField,
  authentication_required: z.boolean().optional().default(true),
});

export const uiScreenUpdateSchema = uiScreenInputSchema;

export type UiScreenInput = z.infer<typeof uiScreenInputSchema>;
export type UiScreenUpdateInput = z.infer<typeof uiScreenUpdateSchema>;

export type UiScreenActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "name" | "route" | "screen_type" | "description" | "purpose" | "authentication_required",
      string[]
    >
  >;
};

const componentDescriptionField = descriptionField;
const componentPurposeField = purposeField;

const technologyField = z
  .string()
  .trim()
  .max(200, "Technology must be 200 characters or fewer")
  .optional()
  .or(z.literal(""));

export const uiComponentTypeField = z.enum(
  UI_COMPONENT_TYPES as unknown as [string, ...string[]],
);

export const uiComponentInputSchema = z.object({
  name: nameField,
  component_type: uiComponentTypeField,
  description: componentDescriptionField,
  purpose: componentPurposeField,
  technology: technologyField,
});

export const uiComponentUpdateSchema = uiComponentInputSchema;

export type UiComponentInput = z.infer<typeof uiComponentInputSchema>;
export type UiComponentUpdateInput = z.infer<typeof uiComponentUpdateSchema>;

export type UiComponentActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "name" | "component_type" | "description" | "purpose" | "technology",
      string[]
    >
  >;
};

const screenComponentLabelField = z
  .string()
  .trim()
  .max(200, "Label must be 200 characters or fewer")
  .optional()
  .or(z.literal(""));

const screenComponentDescriptionField = descriptionField;

export const uiScreenComponentInputSchema = z.object({
  component_id: z.string().uuid("Invalid component"),
  parent_id: z.string().uuid("Invalid parent").optional().or(z.literal("")),
  label: screenComponentLabelField,
  description: screenComponentDescriptionField,
  required: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional(),
});

export const uiScreenComponentUpdateSchema = uiScreenComponentInputSchema;

export type UiScreenComponentInput = z.infer<typeof uiScreenComponentInputSchema>;
export type UiScreenComponentUpdateInput = z.infer<typeof uiScreenComponentUpdateSchema>;

export type UiScreenComponentActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "component_id" | "parent_id" | "label" | "description",
      string[]
    >
  >;
};

const submitLabelField = z
  .string()
  .trim()
  .max(100, "Submit label must be 100 characters or fewer")
  .optional()
  .or(z.literal(""));

const successBehaviorField = z
  .string()
  .trim()
  .max(2000, "Success behavior must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const uiFormInputSchema = z.object({
  name: nameField,
  description: descriptionField,
  submit_label: submitLabelField,
  success_behavior: successBehaviorField,
});

export const uiFormUpdateSchema = uiFormInputSchema;

export type UiFormInput = z.infer<typeof uiFormInputSchema>;
export type UiFormUpdateInput = z.infer<typeof uiFormUpdateSchema>;

export type UiFormActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "name" | "description" | "submit_label" | "success_behavior",
      string[]
    >
  >;
};

const placeholderField = z
  .string()
  .trim()
  .max(500, "Placeholder must be 500 characters or fewer")
  .optional()
  .or(z.literal(""));

const helpTextField = z
  .string()
  .trim()
  .max(2000, "Help text must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

const defaultValueField = z
  .string()
  .trim()
  .max(2000, "Default value must be 2000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const uiFieldTypeField = z.enum(
  UI_FIELD_TYPES as unknown as [string, ...string[]],
);

export const uiFormFieldInputSchema = z.object({
  name: nameField,
  label: labelField,
  field_type: uiFieldTypeField,
  required: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional(),
  placeholder: placeholderField,
  help_text: helpTextField,
  default_value: defaultValueField,
});

export const uiFormFieldUpdateSchema = uiFormFieldInputSchema;

export type UiFormFieldInput = z.infer<typeof uiFormFieldInputSchema>;
export type UiFormFieldUpdateInput = z.infer<typeof uiFormFieldUpdateSchema>;

export type UiFormFieldActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "name" | "label" | "field_type" | "placeholder" | "help_text" | "default_value",
      string[]
    >
  >;
};

const stateDescriptionField = z
  .string()
  .trim()
  .max(3000, "Description must be 3000 characters or fewer")
  .optional()
  .or(z.literal(""));

const behaviorField = z
  .string()
  .trim()
  .max(5000, "Behavior must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const uiStateTypeField = z.enum(
  UI_STATE_TYPES as unknown as [string, ...string[]],
);

export const uiStateInputSchema = z.object({
  name: nameField,
  state_type: uiStateTypeField,
  description: stateDescriptionField,
  behavior: behaviorField,
});

export const uiStateUpdateSchema = uiStateInputSchema;

export type UiStateInput = z.infer<typeof uiStateInputSchema>;
export type UiStateUpdateInput = z.infer<typeof uiStateUpdateSchema>;

export type UiStateActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "state_type" | "description" | "behavior", string[]>
  >;
};

const triggerField = z
  .string()
  .trim()
  .min(1, "Trigger is required")
  .max(500, "Trigger must be 500 characters or fewer");

const actionField = z
  .string()
  .trim()
  .min(1, "Action is required")
  .max(2000, "Action must be 2000 characters or fewer");

export const uiInteractionInputSchema = z.object({
  name: nameField,
  trigger: triggerField,
  action: actionField,
  description: descriptionField,
});

export const uiInteractionUpdateSchema = uiInteractionInputSchema;

export type UiInteractionInput = z.infer<typeof uiInteractionInputSchema>;
export type UiInteractionUpdateInput = z.infer<typeof uiInteractionUpdateSchema>;

export type UiInteractionActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "trigger" | "action" | "description", string[]>
  >;
};

const navigationRouteField = z
  .string()
  .trim()
  .max(500, "Route must be 500 characters or fewer")
  .optional()
  .or(z.literal(""));

export const uiNavigationItemInputSchema = z.object({
  name: nameField,
  label: labelField,
  route: navigationRouteField,
  parent_id: z.string().uuid("Invalid parent").optional().or(z.literal("")),
  description: descriptionField,
});

export const uiNavigationItemUpdateSchema = uiNavigationItemInputSchema;

export type UiNavigationItemInput = z.infer<typeof uiNavigationItemInputSchema>;
export type UiNavigationItemUpdateInput = z.infer<typeof uiNavigationItemUpdateSchema>;

export type UiNavigationItemActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "label" | "route" | "parent_id" | "description", string[]>
  >;
};

export const uiScreenEntityRoleField = z.enum(
  UI_SCREEN_ENTITY_ROLES as unknown as [string, ...string[]],
);
