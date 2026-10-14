import { describe, expect, it } from "vitest";

import { getProjectVersion, listProjectVersions } from "@/lib/versions/queries";

type Row = Record<string, unknown>;

function makeClient(tables: Record<string, { data: Row[] | Row | null; error?: unknown }>) {
  return {
    from(table: string) {
      const result = tables[table] ?? { data: [] };
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        maybeSingle: () => Promise.resolve({ data: result.data, error: result.error ?? null }),
        then: (resolve: (value: { data: Row[] | Row | null; error: unknown }) => unknown) =>
          Promise.resolve({ data: result.data, error: result.error ?? null }).then(resolve),
      };
      return chain;
    },
  } as never;
}

describe("lib/versions/queries", () => {
  it("returns the saved versions for a project", async () => {
    const client = makeClient({
      project_versions: {
        data: [
          {
            id: "v1",
            project_id: "p1",
            label: "Snapshot 2026-10-14 05:00",
            item_count: 42,
            created_by: "u1",
            created_at: "2026-10-14T05:00:00.000Z",
          },
        ],
      },
    });

    const versions = await listProjectVersions("p1", client);
    expect(versions).toHaveLength(1);
    expect(versions[0]?.label).toBe("Snapshot 2026-10-14 05:00");
    expect(versions[0]?.item_count).toBe(42);
  });

  it("returns an empty list when the query fails", async () => {
    const client = makeClient({
      project_versions: { data: null, error: { message: "boom" } },
    });

    await expect(listProjectVersions("p1", client)).resolves.toEqual([]);
  });

  it("returns null when a single version is missing", async () => {
    const client = makeClient({ project_versions: { data: null } });
    await expect(getProjectVersion("missing", client)).resolves.toBeNull();
  });
});
