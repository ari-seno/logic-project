import { describe, expect, it } from "vitest";

import { listProjectActivity } from "@/lib/activity/queries";

type Row = Record<string, unknown>;

// Minimal stand-in for the Supabase client: every chain resolves to the rows
// registered for that table, so the merge/sort logic can be exercised.
function makeClient(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      const rows = tables[table] ?? [];
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder.select = chain;
      builder.eq = chain;
      builder.order = chain;
      builder.limit = chain;
      builder.then = (resolve: (value: { data: Row[]; error: null }) => unknown) =>
        Promise.resolve({ data: rows, error: null }).then(resolve);
      return builder;
    },
  } as never;
}

const AT = (iso: string) => iso;

describe("activity queries", () => {
  it("merges every section and sorts newest first", async () => {
    const client = makeClient({
      requirements: [
        {
          id: "r1",
          title: "Borrowers can apply",
          created_at: AT("2026-01-01T00:00:00.000Z"),
          updated_at: AT("2026-01-02T00:00:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "t1",
          title: "Build schema",
          created_at: AT("2026-01-05T00:00:00.000Z"),
          updated_at: AT("2026-01-05T00:00:00.000Z"),
        },
      ],
      ai_suggestions: [
        { id: "a1", stage: "decisions", created_at: AT("2026-01-03T00:00:00.000Z") },
      ],
    });

    const items = await listProjectActivity("p1", client);

    expect(items.map((item) => item.id)).toEqual(["task-t1", "ai-a1", "requirement-r1"]);
    expect(items[0]).toMatchObject({
      kind: "task",
      action: "created",
      href: "tasks/t1",
    });
    expect(items[1]).toMatchObject({
      kind: "ai",
      action: "generated",
      title: "Generated decisions suggestions",
      href: "ai-history",
    });
    expect(items[2].action).toBe("updated");
  });

  it("builds entity links through the domain and endpoint titles from method + path", async () => {
    const client = makeClient({
      entities: [
        {
          id: "e1",
          name: "Loan",
          domain_id: "d1",
          created_at: AT("2026-01-01T00:00:00.000Z"),
          updated_at: AT("2026-01-01T00:00:00.000Z"),
        },
      ],
      api_endpoints: [
        {
          id: "ep1",
          method: "POST",
          path: "/loans",
          created_at: AT("2026-01-01T00:00:00.000Z"),
          updated_at: AT("2026-01-01T00:00:00.000Z"),
        },
      ],
    });

    const items = await listProjectActivity("p1", client);
    const entity = items.find((item) => item.kind === "entity");
    const endpoint = items.find((item) => item.kind === "endpoint");

    expect(entity?.href).toBe("domains/d1/entities/e1");
    expect(endpoint?.title).toBe("POST /loans");
  });

  it("falls back to (untitled) when a row has no name", async () => {
    const client = makeClient({
      domains: [
        {
          id: "d1",
          name: "",
          created_at: AT("2026-01-01T00:00:00.000Z"),
          updated_at: AT("2026-01-01T00:00:00.000Z"),
        },
      ],
    });

    const items = await listProjectActivity("p1", client);
    expect(items[0].title).toBe("(untitled)");
  });

  it("returns nothing when the project has no rows", async () => {
    const items = await listProjectActivity("p1", makeClient({}));
    expect(items).toEqual([]);
  });

  it("caps the feed at 30 items", async () => {
    const rows: Row[] = Array.from({ length: 8 }, (_, index) => ({
      id: `r${index}`,
      title: `Requirement ${index}`,
      created_at: `2026-01-0${index + 1}T00:00:00.000Z`,
      updated_at: `2026-01-0${index + 1}T00:00:00.000Z`,
    }));
    const client = makeClient({
      requirements: rows,
      decisions: rows,
      domains: rows,
      tasks: rows,
      ai_suggestions: rows.map((row) => ({
        id: String(row.id),
        stage: "tasks",
        created_at: row.created_at,
      })),
    });

    const items = await listProjectActivity("p1", client);
    expect(items).toHaveLength(30);
  });
});
