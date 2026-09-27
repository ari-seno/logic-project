"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Select } from "@/components/ui/select";
import {
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/supabase/types";
import { updateTaskStatus } from "@/lib/tasks/actions";

export function TaskStatusChanger({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const [, startTransition] = useTransition();
  function handle(e: React.ChangeEvent<HTMLSelectElement>) {
    const fd = new FormData();
    fd.set("id", taskId);
    fd.set("status", e.target.value);
    startTransition(async () => {
      const r = await updateTaskStatus(fd);
      if (r && "error" in r && r.error) {
        toast.error(r.error);
      }
    });
  }
  return (
    <Select
      aria-label="Change status"
      defaultValue={status}
      onChange={handle}
      className="w-auto"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </Select>
  );
}
