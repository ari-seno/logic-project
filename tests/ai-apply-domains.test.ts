import { describe, expect, it } from "vitest";

import {
  buildAttributeRow,
  buildDomainRow,
  buildEntityRow,
  buildErdBundle,
  buildRelationshipRow,
  relationshipDedupeKey,
} from "@/lib/ai/apply";

const SOURCE_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_ID = "22222222-2222-4222-8222-222222222222";

describe("ai/apply ERD row builders", () => {
  it("maps a domain item and turns an empty description into null", () => {
    const row = buildDomainRow({ name: "  Billing  ", description: "" });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Billing");
    expect(row?.description).toBeNull();
  });

  it("rejects a domain item with a blank name", () => {
    expect(buildDomainRow({ name: "   ", description: "x" })).toBeNull();
  });

  it("maps an entity item and keeps its description", () => {
    const row = buildEntityRow({ name: "Invoice", description: "A bill" });

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Invoice");
    expect(row?.description).toBe("A bill");
  });

  it("maps an attribute item onto the column shape", () => {
    const row = buildAttributeRow({
      name: "due_date",
      data_type: "date",
      is_required: true,
      is_primary_key: false,
      description: "",
    });

    expect(row).not.toBeNull();
    expect(row?.data_type).toBe("date");
    expect(row?.is_required).toBe(true);
    expect(row?.is_primary_key).toBe(false);
    expect(row?.description).toBeNull();
  });

  it("rejects an attribute item with an unsupported data type", () => {
    const row = buildAttributeRow({
      name: "amount",
      data_type: "money" as never,
      is_required: false,
      is_primary_key: false,
      description: "",
    });

    expect(row).toBeNull();
  });

  it("maps a relationship item onto the column shape", () => {
    const row = buildRelationshipRow(
      {
        target_entity: "Customer",
        relationship_type: "many_to_one",
        name: "",
        description: "Billed to",
      },
      SOURCE_ID,
      TARGET_ID,
    );

    expect(row).not.toBeNull();
    expect(row?.source_entity_id).toBe(SOURCE_ID);
    expect(row?.target_entity_id).toBe(TARGET_ID);
    expect(row?.relationship_type).toBe("many_to_one");
    expect(row?.name).toBeNull();
    expect(row?.description).toBe("Billed to");
  });

  it("rejects a relationship item whose endpoints are not uuids", () => {
    const row = buildRelationshipRow(
      {
        target_entity: "Customer",
        relationship_type: "one_to_many",
        name: "",
        description: "",
      },
      "not-a-uuid",
      TARGET_ID,
    );

    expect(row).toBeNull();
  });

  it("builds a stable de-duplication key per endpoint pair and type", () => {
    expect(
      relationshipDedupeKey(SOURCE_ID, TARGET_ID, "one_to_many"),
    ).toBe(`${SOURCE_ID}|${TARGET_ID}|one_to_many`);

    expect(
      relationshipDedupeKey(SOURCE_ID, TARGET_ID, "one_to_many"),
    ).not.toBe(relationshipDedupeKey(SOURCE_ID, TARGET_ID, "many_to_one"));
  });
});

describe("ai/apply ERD bundle builder", () => {
  const item = {
    name: "Billing",
    description: "Invoices",
    entities: [
      {
        name: "Invoice",
        description: "A bill",
        attributes: [
          {
            name: "id",
            data_type: "uuid" as const,
            is_required: true,
            is_primary_key: true,
            description: "",
          },
        ],
        relationships: [
          {
            target_entity: "Customer",
            relationship_type: "many_to_one" as const,
            name: "",
            description: "",
          },
        ],
      },
    ],
  };

  it("shapes the selected items into the payload the SQL function expects", () => {
    const { domains, skipped } = buildErdBundle([item], [0]);

    expect(skipped).toEqual([]);
    expect(domains).toHaveLength(1);
    expect(domains[0]?.index).toBe(0);
    expect(domains[0]?.name).toBe("Billing");
    expect(domains[0]?.entities[0]?.name).toBe("Invoice");
    expect(domains[0]?.entities[0]?.attributes[0]?.data_type).toBe("uuid");
    expect(domains[0]?.entities[0]?.relationships[0]?.target_entity).toBe(
      "Customer",
    );
  });

  it("ignores indices that are out of range or not integers", () => {
    const { domains, skipped } = buildErdBundle([item], [0, 5, -1, 1.5]);

    expect(domains).toHaveLength(1);
    expect(skipped).toEqual([]);
  });

  it("reports an item with a blank domain name as skipped, not included", () => {
    const { domains, skipped } = buildErdBundle(
      [{ ...item, name: "   " }],
      [0],
    );

    expect(domains).toEqual([]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.kind).toBe("skipped");
    expect(
      skipped[0]?.kind === "skipped" ? skipped[0].reason : null,
    ).toBe("invalid");
  });

  it("de-duplicates repeated indices", () => {
    const { domains } = buildErdBundle([item], [0, 0, 0]);
    expect(domains).toHaveLength(1);
  });
});
