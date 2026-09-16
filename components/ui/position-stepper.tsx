"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function PositionStepper({
  action,
  canMoveUp,
  canMoveDown,
  itemId,
  parentId,
  parentField,
  label,
}: {
  action: (formData: FormData) => Promise<{ ok?: true; error?: string } | undefined>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  itemId: string;
  parentId: string;
  parentField: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    const formData = new FormData();
    formData.set("id", itemId);
    formData.set(parentField, parentId);
    formData.set("direction", direction);
    startTransition(() => {
      void action(formData);
    });
  }

  return (
    <div className="inline-flex flex-col gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => move("up")}
        disabled={!canMoveUp || pending}
        aria-label={`Move ${label} up`}
        className="h-5 w-7 px-0 text-xs"
      >
        ▲
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => move("down")}
        disabled={!canMoveDown || pending}
        aria-label={`Move ${label} down`}
        className="h-5 w-7 px-0 text-xs"
      >
        ▼
      </Button>
    </div>
  );
}
