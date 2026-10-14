"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { saveProjectVersion } from "@/lib/versions/actions";

export function SaveVersionButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await saveProjectVersion({ projectId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Version saved.");
      router.refresh();
    });
  }

  return (
    <Button variant="secondary" size="sm" onClick={save} disabled={pending}>
      {pending ? "Saving…" : "Save version"}
    </Button>
  );
}
