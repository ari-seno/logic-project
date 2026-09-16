import { describe, expect, it } from "vitest";

import { PROTECTED_PREFIXES, AUTH_PREFIXES, isProtectedPath, isAuthPath } from "@/lib/supabase/middleware-paths";

describe("route classification helpers", () => {
  it("classifies dashboard as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/123")).toBe(true);
  });

  it("classifies projects as protected", () => {
    expect(isProtectedPath("/projects")).toBe(true);
    expect(isProtectedPath("/projects/abc-123")).toBe(true);
    expect(isProtectedPath("/projects/new")).toBe(true);
  });

  it("does not classify the landing page as protected", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
  });

  it("classifies login and register as auth pages", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/register")).toBe(true);
  });

  it("does not classify other pages as auth", () => {
    expect(isAuthPath("/dashboard")).toBe(false);
    expect(isAuthPath("/projects")).toBe(false);
    expect(isAuthPath("/")).toBe(false);
  });

  it("exposes the protected and auth prefixes", () => {
    expect(PROTECTED_PREFIXES).toContain("/dashboard");
    expect(PROTECTED_PREFIXES).toContain("/projects");
    expect(AUTH_PREFIXES).toContain("/login");
    expect(AUTH_PREFIXES).toContain("/register");
  });
});
