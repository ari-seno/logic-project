import { describe, expect, it } from "vitest";

import { buildDependencyChain } from "@/lib/tasks/dependency-chain";

const tasks = [
  { id: "a", title: "A" },
  { id: "b", title: "B" },
  { id: "c", title: "C" },
];

describe("buildDependencyChain", () => {
  it("returns just the start task when nothing depends on it", () => {
    expect(buildDependencyChain("a", tasks, [])).toEqual(["A"]);
  });

  it("walks blocks edges forward with indentation", () => {
    const deps = [
      { task_id: "b", depends_on_task_id: "a", dependency_type: "blocks" },
      { task_id: "c", depends_on_task_id: "b", dependency_type: "blocks" },
    ];
    expect(buildDependencyChain("a", tasks, deps)).toEqual(["A", "  B", "    C"]);
  });

  it("ignores non-blocks dependencies", () => {
    const deps = [
      { task_id: "b", depends_on_task_id: "a", dependency_type: "related" },
    ];
    expect(buildDependencyChain("a", tasks, deps)).toEqual(["A"]);
  });

  it("does not loop on cycles", () => {
    const deps = [
      { task_id: "a", depends_on_task_id: "b", dependency_type: "blocks" },
      { task_id: "b", depends_on_task_id: "a", dependency_type: "blocks" },
    ];
    expect(buildDependencyChain("a", tasks, deps)).toEqual(["A", "  B"]);
  });

  it("falls back to the id when a title is unknown", () => {
    const deps = [
      { task_id: "zzz", depends_on_task_id: "a", dependency_type: "blocks" },
    ];
    expect(buildDependencyChain("a", tasks, deps)).toEqual(["A", "  zzz"]);
  });
});
