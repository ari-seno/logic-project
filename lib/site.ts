// The canonical base URL for absolute links (sitemap, robots, auth redirects).
// NEXT_PUBLIC_SITE_URL wins; a trailing slash is trimmed so callers can append
// a path safely. Falls back to the local dev origin.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";
