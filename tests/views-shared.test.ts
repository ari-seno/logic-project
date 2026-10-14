import { describe, expect, it } from "vitest";

import {
  VIEW_LABEL_MAX,
  VIEW_QUERY_MAX,
  isViewScope,
  normalizeViewLabel,
  normalizeViewQuery,
  sectionPath,
  viewHref,
} from "@/lib/views/shared";

describe("views/shared", () => {
  it("accepts only the supported scopes", () => {
    expect(isViewScope("requirements")).toBe(true);
    expect(isViewScope("tasks")).toBe(true);
    expect(isViewScope("api")).toBe(false);
    expect(isViewScope(null)).toBe(false);
  });

  it("trims and collapses a label and caps its length", () => {
    expect(normalizeViewLabel("  High   priority  ")).toBe("High priority");
    expect(normalizeViewLabel("a".repeat(200))).toHaveLength(VIEW_LABEL_MAX);
  });

  it("strips a leading question mark from a query and caps its length", () => {
    expect(normalizeViewQuery("?status=done&sort=priority")).toBe(
      "status=done&sort=priority",
    );
    expect(normalizeViewQuery("a".repeat(900))).toHaveLength(VIEW_QUERY_MAX);
    expect(normalizeViewQuery("   ")).toBe("");
  });

  it("builds section paths and hrefs", () => {
    expect(sectionPath("p1", "tasks")).toBe("/projects/p1/tasks");
    expect(sectionPath("p1", "requirements")).toBe(
      "/projects/p1/requirements",
    );
    expect(viewHref("p1", "tasks", "status=done")).toBe(
      "/projects/p1/tasks?status=done",
    );
    expect(viewHref("p1", "tasks", "?status=done")).toBe(
      "/projects/p1/tasks?status=done",
    );
    expect(viewHref("p1", "requirements", "")).toBe(
      "/projects/p1/requirements",
    );
  });
});
