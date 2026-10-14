"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  TaskBlockedBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
  TaskTypeBadge,
} from "@/components/projects/badges";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DataCell,
  DataList,
  DataRow,
  type DataListColumn,
} from "@/components/ui/data-list";
import { Select } from "@/components/ui/select";
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/supabase/types";
import {
  bulkDeleteTasks,
  bulkSetTaskPriority,
  bulkSetTaskStatus,
  deleteTask,
} from "@/lib/tasks/actions";
import { TASK_BULK_PRIORITIES, TASK_BULK_STATUSES } from "@/lib/tasks/bulk";

export type TaskTableRow = {
  id: string;
  title: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  updatedLabel: string;
  parent: { id: string; title: string } | null;
  blocked: boolean;
};

type ConfirmState =
  | { kind: "row"; id: string; title: string }
  | { kind: "bulk"; count: number }
  | null;

export function TasksTable({
  projectId,
  rows,
  columns,
}: {
  projectId: string;
  rows: TaskTableRow[];
  columns: DataListColumn[];
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [statusValue, setStatusValue] = useState<string>(TASK_BULK_STATUSES[0]);
  const [priorityValue, setPriorityValue] = useState<string>("medium");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedIds = [...selected];
  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function report(
    result: { ok: true; count: number } | { error: string },
    verb: string,
  ) {
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    setError(null);
    setSelected(new Set());
    toast.success(
      `${verb} ${result.count} task${result.count === 1 ? "" : "s"}.`,
    );
  }

  function applyStatus() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      report(
        await bulkSetTaskStatus({
          projectId,
          ids: selectedIds,
          status: statusValue,
        }),
        "Updated",
      );
    });
  }

  function applyPriority() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      report(
        await bulkSetTaskPriority({
          projectId,
          ids: selectedIds,
          priority: priorityValue,
        }),
        "Updated",
      );
    });
  }

  function confirmDelete() {
    const target = confirm;
    if (!target) return;
    startTransition(async () => {
      if (target.kind === "row") {
        const fd = new FormData();
        fd.set("id", target.id);
        const result = await deleteTask(fd);
        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
          setConfirm(null);
        }
        return;
      }
      const result = await bulkDeleteTasks({ projectId, ids: selectedIds });
      setConfirm(null);
      report(result, "Deleted");
    });
  }

  const headerCheckbox = (
    <input
      type="checkbox"
      aria-label="Select all tasks"
      className="h-4 w-4"
      checked={allSelected}
      ref={(node) => {
        if (node) node.indeterminate = selected.size > 0 && !allSelected;
      }}
      onChange={(event) =>
        setSelected(
          event.target.checked ? new Set(rows.map((row) => row.id)) : new Set(),
        )
      }
    />
  );

  const allColumns: DataListColumn[] = [
    { key: "select", label: headerCheckbox, className: "w-10" },
    ...columns,
  ];

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
          <span className="text-sm font-medium" role="status">
            {selected.size} selected
          </span>
          <Select
            aria-label="Set status"
            className="w-auto"
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
          >
            {TASK_BULK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={applyStatus}
            disabled={pending}
          >
            Set status
          </Button>
          <Select
            aria-label="Set priority"
            className="w-auto"
            value={priorityValue}
            onChange={(event) => setPriorityValue(event.target.value)}
          >
            {TASK_BULK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={applyPriority}
            disabled={pending}
          >
            Set priority
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() =>
              setConfirm({ kind: "bulk", count: selected.size })
            }
            disabled={pending}
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
            disabled={pending}
          >
            Clear
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <DataList caption="Project tasks" columns={allColumns}>
        {rows.map((row) => (
          <DataRow key={row.id} interactive>
            <DataCell className="w-10">
              <input
                type="checkbox"
                aria-label={`Select ${row.title}`}
                className="h-4 w-4"
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
              />
            </DataCell>
            <DataCell>
              <Link
                href={`/projects/${projectId}/tasks/${row.id}`}
                className="font-medium hover:underline"
              >
                {row.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                {row.parent ? (
                  <span>
                    Parent:{" "}
                    <Link
                      href={`/projects/${projectId}/tasks/${row.parent.id}`}
                      className="hover:underline"
                    >
                      {row.parent.title}
                    </Link>
                  </span>
                ) : null}
                <span>Updated {row.updatedLabel}</span>
              </div>
            </DataCell>
            <DataCell>
              <TaskTypeBadge type={row.taskType} />
            </DataCell>
            <DataCell>
              <TaskStatusBadge status={row.status} />
            </DataCell>
            <DataCell>
              <TaskPriorityBadge priority={row.priority} />
            </DataCell>
            <DataCell>
              {row.blocked ? <TaskBlockedBadge /> : null}
            </DataCell>
            <DataCell align="right">
              <Button
                type="button"
                variant="danger"
                size="sm"
                aria-label={`Delete ${row.title}`}
                disabled={pending}
                onClick={() =>
                  setConfirm({ kind: "row", id: row.id, title: row.title })
                }
              >
                Delete
              </Button>
            </DataCell>
          </DataRow>
        ))}
      </DataList>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={
          confirm?.kind === "bulk"
            ? `Delete ${confirm.count} task${confirm.count === 1 ? "" : "s"}?`
            : `Delete "${confirm?.kind === "row" ? confirm.title : ""}"?`
        }
        description="This also removes the task's dependencies and links. This cannot be undone."
        confirmLabel="Delete"
        typeToConfirm
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
