"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  PriorityBadge,
  RequirementStatusBadge,
  TypeBadge,
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
import type {
  RequirementPriority,
  RequirementStatus,
  RequirementType,
} from "@/lib/supabase/types";
import {
  bulkDeleteRequirements,
  bulkSetRequirementPriority,
  bulkSetRequirementStatus,
  deleteRequirement,
} from "@/lib/requirements/actions";
import {
  REQUIREMENT_BULK_PRIORITIES,
  REQUIREMENT_BULK_STATUSES,
} from "@/lib/requirements/bulk";

export type RequirementTableRow = {
  id: string;
  title: string;
  type: RequirementType;
  status: RequirementStatus;
  priority: RequirementPriority;
  updatedLabel: string;
};

type ConfirmState =
  | { kind: "row"; id: string; title: string }
  | { kind: "bulk"; count: number }
  | null;

export function RequirementsTable({
  projectId,
  rows,
  columns,
}: {
  projectId: string;
  rows: RequirementTableRow[];
  columns: DataListColumn[];
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [statusValue, setStatusValue] = useState<string>(
    REQUIREMENT_BULK_STATUSES[1],
  );
  const [priorityValue, setPriorityValue] = useState<string>("high");
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
      `${verb} ${result.count} requirement${result.count === 1 ? "" : "s"}.`,
    );
  }

  function applyStatus() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      report(
        await bulkSetRequirementStatus({
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
        await bulkSetRequirementPriority({
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
        fd.set("projectId", projectId);
        const result = await deleteRequirement(fd);
        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
          setConfirm(null);
        }
        return;
      }
      const result = await bulkDeleteRequirements({ projectId, ids: selectedIds });
      setConfirm(null);
      report(result, "Deleted");
    });
  }

  const headerCheckbox = (
    <input
      type="checkbox"
      aria-label="Select all requirements"
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
            {REQUIREMENT_BULK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
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
            {REQUIREMENT_BULK_PRIORITIES.map((value) => (
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
            onClick={() => setConfirm({ kind: "bulk", count: selected.size })}
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

      <DataList caption="Project requirements" columns={allColumns}>
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
                href={`/projects/${projectId}/requirements/${row.id}`}
                className="font-medium hover:underline"
              >
                {row.title}
              </Link>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                Updated {row.updatedLabel}
              </div>
            </DataCell>
            <DataCell>
              <TypeBadge type={row.type} />
            </DataCell>
            <DataCell>
              <RequirementStatusBadge status={row.status} />
            </DataCell>
            <DataCell>
              <PriorityBadge priority={row.priority} />
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
            ? `Delete ${confirm.count} requirement${confirm.count === 1 ? "" : "s"}?`
            : `Delete "${confirm?.kind === "row" ? confirm.title : ""}"?`
        }
        description="Requirements linked from tasks keep their other data. This cannot be undone."
        confirmLabel="Delete"
        typeToConfirm
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
