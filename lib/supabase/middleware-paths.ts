export const PROTECTED_PREFIXES = ["/dashboard", "/projects"];
export const AUTH_PREFIXES = ["/login", "/register"];

function matchesPrefix(prefix: string, path: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(prefix, pathname));
}

export function isAuthPath(pathname: string) {
  return AUTH_PREFIXES.some((prefix) => matchesPrefix(prefix, pathname));
}
