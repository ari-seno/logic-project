import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components"];

function collectTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);

    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      files.push(...collectTsxFiles(full));
      continue;
    }

    if (entry.endsWith(".tsx")) files.push(full);
  }

  return files;
}

/**
 * Collects the literal `id="..."` attributes in a file. Only static string
 * literals are considered: templated ids (`id={`x-${y}`}`) are unique per
 * instance by construction and cannot be checked statically.
 */
function staticIds(source: string): Map<string, number> {
  const pattern = /\bid=(?:"([^"]+)"|'([^']+)')/g;
  const ids = new Map<string, number>();

  for (const match of source.matchAll(pattern)) {
    const id = match[1] ?? match[2];
    if (!id) continue;
    ids.set(id, (ids.get(id) ?? 0) + 1);
  }

  return ids;
}

describe("no duplicate static id attributes inside a component file", () => {
  const files = SCAN_DIRS.flatMap((dir) => collectTsxFiles(join(ROOT, dir)));

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("has at most one occurrence of each static id per file", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const ids = staticIds(readFileSync(file, "utf8"));
      const duplicates = [...ids.entries()].filter(([, count]) => count > 1);

      for (const [id, count] of duplicates) {
        offenders.push(`${relative(ROOT, file)}: id="${id}" appears ${count}x`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
