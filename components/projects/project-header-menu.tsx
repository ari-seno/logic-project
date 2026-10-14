"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Layers, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ProjectHeaderMenu({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleConfirm() {
    const { deleteProject } = await import("@/lib/projects/actions");
    const fd = new FormData();
    fd.set("id", projectId);
    startTransition(async () => {
      const result = await deleteProject(fd);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="Project actions"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-44 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-3)]"
          >
            <DropdownMenu.Item asChild>
              <Link
                href={`/projects/${projectId}/edit`}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-[var(--muted)]"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit project
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                startTransition(async () => {
                  const { saveProjectVersion } = await import(
                    "@/lib/versions/actions"
                  );
                  const result = await saveProjectVersion({ projectId });
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Version saved.");
                });
              }}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-[var(--muted)]"
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              Save version
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-sm text-[var(--danger)] outline-none data-[highlighted]:bg-[var(--muted)]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete project
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${projectName}"?`}
        description={
          <>
            This permanently removes the project and all its requirements,
            decisions, domains, architecture, API design, UI design, and tasks.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        typeToConfirm
        pending={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
