"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ProjectTemplateSummary } from "@/lib/projects/templates";
import { createProjectFromTemplateAction } from "@/lib/projects/template-actions";

export function TemplateMenu({
  templates,
}: {
  templates: ProjectTemplateSummary[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function pick(templateId: string) {
    setOpen(false);
    startTransition(async () => {
      const result = await createProjectFromTemplateAction(templateId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Project created from template.");
      router.push(`/projects/${result.projectId}`);
    });
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="secondary"
          size="md"
          disabled={pending}
          aria-label="Create a project from a template"
        >
          <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
          {pending ? "Creating…" : "From template"}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-80 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-1 shadow-[var(--shadow-3)]"
        >
          {templates.map((template) => (
            <DropdownMenu.Item
              key={template.id}
              onSelect={() => pick(template.id)}
              className="flex cursor-pointer flex-col items-start gap-1 rounded-lg px-3 py-2.5 outline-none data-[highlighted]:bg-[var(--muted)]"
            >
              <span className="text-sm font-medium text-[var(--foreground)]">
                {template.label}
              </span>
              <span className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                {template.description}
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
