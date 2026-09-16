import { describe, expect, it } from "vitest";

import {
  uiScreenInputSchema,
  uiComponentInputSchema,
  uiFormInputSchema,
  uiFormFieldInputSchema,
  uiStateInputSchema,
  uiInteractionInputSchema,
  uiNavigationItemInputSchema,
  uiScreenEntityRoleField,
} from "@/lib/validation/ui";

describe("ui screen validation", () => {
  it("accepts a valid screen", () => {
    const r = uiScreenInputSchema.safeParse({
      name: "Project Detail",
      route: "/projects/:id",
      screen_type: "detail",
      description: "Detailed view",
      purpose: "Inspect a single project",
      authentication_required: true,
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty name", () => {
    const r = uiScreenInputSchema.safeParse({
      name: "",
      route: "",
      screen_type: "page",
      description: "",
      purpose: "",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("rejects name longer than 200 chars", () => {
    const r = uiScreenInputSchema.safeParse({
      name: "a".repeat(201),
      route: "",
      screen_type: "page",
      description: "",
      purpose: "",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("rejects unsupported screen type", () => {
    const r = uiScreenInputSchema.safeParse({
      name: "X",
      route: "",
      screen_type: "bogus",
      description: "",
      purpose: "",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("rejects route longer than 500 chars", () => {
    const r = uiScreenInputSchema.safeParse({
      name: "X",
      route: "/" + "a".repeat(500),
      screen_type: "page",
      description: "",
      purpose: "",
      authentication_required: true,
    });
    expect(r.success).toBe(false);
  });
  it("accepts all 13 screen types", () => {
    for (const t of [
      "page",
      "modal",
      "drawer",
      "dialog",
      "wizard",
      "dashboard",
      "form",
      "list",
      "detail",
      "settings",
      "authentication",
      "error",
      "other",
    ]) {
      const r = uiScreenInputSchema.safeParse({
        name: "X",
        route: "",
        screen_type: t,
        description: "",
        purpose: "",
        authentication_required: true,
      });
      expect(r.success).toBe(true);
    }
  });
});

describe("ui component validation", () => {
  it("accepts a valid component", () => {
    const r = uiComponentInputSchema.safeParse({
      name: "Project Card",
      component_type: "card",
      description: "Card surface for project summaries",
      purpose: "Display a project",
      technology: "React",
    });
    expect(r.success).toBe(true);
  });
  it("rejects unsupported component type", () => {
    const r = uiComponentInputSchema.safeParse({
      name: "X",
      component_type: "bogus",
      description: "",
      purpose: "",
      technology: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects tech longer than 200 chars", () => {
    const r = uiComponentInputSchema.safeParse({
      name: "X",
      component_type: "card",
      description: "",
      purpose: "",
      technology: "a".repeat(201),
    });
    expect(r.success).toBe(false);
  });
  it("accepts all component types", () => {
    for (const t of [
      "layout",
      "navigation",
      "header",
      "footer",
      "sidebar",
      "card",
      "table",
      "list",
      "form",
      "input",
      "textarea",
      "select",
      "checkbox",
      "radio",
      "button",
      "modal",
      "dialog",
      "drawer",
      "tabs",
      "badge",
      "alert",
      "notification",
      "chart",
      "custom",
      "other",
    ]) {
      const r = uiComponentInputSchema.safeParse({
        name: "X",
        component_type: t,
        description: "",
        purpose: "",
        technology: "",
      });
      expect(r.success).toBe(true);
    }
  });
});

describe("ui form validation", () => {
  it("accepts a valid form", () => {
    const r = uiFormInputSchema.safeParse({
      name: "Create Project",
      description: "Form to create a project",
      submit_label: "Save",
      success_behavior: "Redirect to detail",
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty name", () => {
    const r = uiFormInputSchema.safeParse({
      name: "",
      description: "",
      submit_label: "",
      success_behavior: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects submit_label longer than 100 chars", () => {
    const r = uiFormInputSchema.safeParse({
      name: "X",
      description: "",
      submit_label: "a".repeat(101),
      success_behavior: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("ui form field validation", () => {
  it("accepts a valid field", () => {
    const r = uiFormFieldInputSchema.safeParse({
      name: "name",
      label: "Project name",
      field_type: "text",
      required: "on",
      placeholder: "My project",
      help_text: "Required for everyone",
      default_value: "",
    });
    expect(r.success).toBe(true);
  });
  it("rejects unsupported field type", () => {
    const r = uiFormFieldInputSchema.safeParse({
      name: "x",
      label: "X",
      field_type: "bogus",
      required: "",
      placeholder: "",
      help_text: "",
      default_value: "",
    });
    expect(r.success).toBe(false);
  });
  it("requires name and label", () => {
    const r1 = uiFormFieldInputSchema.safeParse({
      name: "",
      label: "X",
      field_type: "text",
      required: "",
      placeholder: "",
      help_text: "",
      default_value: "",
    });
    expect(r1.success).toBe(false);
    const r2 = uiFormFieldInputSchema.safeParse({
      name: "x",
      label: "",
      field_type: "text",
      required: "",
      placeholder: "",
      help_text: "",
      default_value: "",
    });
    expect(r2.success).toBe(false);
  });
});

describe("ui state validation", () => {
  it("accepts a valid state", () => {
    const r = uiStateInputSchema.safeParse({
      name: "Loading",
      state_type: "loading",
      description: "While data is fetching",
      behavior: "Show skeleton",
    });
    expect(r.success).toBe(true);
  });
  it("rejects unsupported state type", () => {
    const r = uiStateInputSchema.safeParse({
      name: "X",
      state_type: "bogus",
      description: "",
      behavior: "",
    });
    expect(r.success).toBe(false);
  });
  it("accepts all state types", () => {
    for (const t of [
      "default",
      "loading",
      "empty",
      "success",
      "error",
      "disabled",
      "unauthorized",
      "forbidden",
      "not_found",
      "validation_error",
      "offline",
      "custom",
    ]) {
      const r = uiStateInputSchema.safeParse({
        name: "X",
        state_type: t,
        description: "",
        behavior: "",
      });
      expect(r.success).toBe(true);
    }
  });
});

describe("ui interaction validation", () => {
  it("accepts a valid interaction", () => {
    const r = uiInteractionInputSchema.safeParse({
      name: "Submit Create Project",
      trigger: "Click submit",
      action: "POST /api/projects",
      description: "",
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty trigger", () => {
    const r = uiInteractionInputSchema.safeParse({
      name: "X",
      trigger: "",
      action: "POST /x",
      description: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects empty action", () => {
    const r = uiInteractionInputSchema.safeParse({
      name: "X",
      trigger: "Click",
      action: "",
      description: "",
    });
    expect(r.success).toBe(false);
  });
  it("rejects trigger longer than 500 chars", () => {
    const r = uiInteractionInputSchema.safeParse({
      name: "X",
      trigger: "a".repeat(501),
      action: "POST /x",
      description: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("ui navigation item validation", () => {
  it("accepts a valid navigation item", () => {
    const r = uiNavigationItemInputSchema.safeParse({
      name: "Projects",
      label: "Projects",
      route: "/projects",
      parent_id: "",
      description: "",
    });
    expect(r.success).toBe(true);
  });
  it("requires name and label", () => {
    const r = uiNavigationItemInputSchema.safeParse({
      name: "",
      label: "X",
      route: "",
      parent_id: "",
      description: "",
    });
    expect(r.success).toBe(false);
    const r2 = uiNavigationItemInputSchema.safeParse({
      name: "X",
      label: "",
      route: "",
      parent_id: "",
      description: "",
    });
    expect(r2.success).toBe(false);
  });
});

describe("ui screen entity role field", () => {
  it("accepts known roles", () => {
    for (const r of [
      "displayed",
      "created",
      "edited",
      "deleted",
      "filtered",
      "selected",
      "related",
    ]) {
      const v = uiScreenEntityRoleField.safeParse(r);
      expect(v.success).toBe(true);
    }
  });
  it("rejects unknown role", () => {
    const v = uiScreenEntityRoleField.safeParse("bogus");
    expect(v.success).toBe(false);
  });
});
