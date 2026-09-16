import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="Nothing here yet"
        description="Add something to get started."
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Nothing here yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Add something to get started.")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={<button>Create</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders icon when provided via EmptyStateIcon", () => {
    const { container } = render(
      <EmptyState
        title="Empty"
        icon={
          <EmptyStateIcon>
            <path d="M0 0h24v24H0z" />
          </EmptyStateIcon>
        }
      />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
