"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataCell, DataList, DataRow } from "@/components/ui/data-list";
import type { DataListColumn } from "@/components/ui/data-list";
import {
  deleteProjectVersion,
  restoreProjectVersionAsNew,
} from "@/lib/versions/actions";
import type { ProjectVersionSummary } from "@/lib/versions/queries";

const COLUMNS: DataListColumn[] = [
  { key: "label", label: "Version" },
  { key: "items", label: "Items", align: "right" },
  { key: "created", label: "Saved" },
  { key: "actions", label: "", align: "right" },
];

export function VersionsTable({
  projectId,
  rows,
}: {
  projectId: string;
  rows: ProjectVersionSummary[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ProjectVersionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  function restore(row: ProjectVersionSummary) {
    setError(null);
    setBusyId(row.id);
    startTransition(async () => {
      const result = await restoreProjectVersionAsNew({
        projectId,
        versionId: row.id,
      });
      setBusyId(null);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Restored as a new project.");
      router.push(`/projects/${result.projectId}`);
    });
  }

  function remove(row: ProjectVersionSummary) {
    setConfirm(null);
    setError(null);
    setBusyId(row.id);
    startTransition(async () => {
      const result = await deleteProjectVersion({
        projectId,
        versionId: row.id,
      });
      setBusyId(null);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Version deleted.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="text-xs text-[var(--danger-fg)]" role="alert">
          {error}
        </p>
      ) : null}

      <DataList caption="Saved versions" columns={COLUMNS}>
        {rows.map((row) => (
          <DataRow key={row.id} interactive>
            <DataCell>
              <span className="font-medium">{row.label}</span>
            </DataCell>
            <DataCell align="right" mono>
              {row.item_count}
            </DataCell>
            <DataCell>{row.created_at.slice(0, 16).replace("T", " ")}</DataCell>
            <DataCell align="right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending && busyId === row.id}
                  onClick={() => restore(row)}
                >
                  Restore
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={pending && busyId === row.id}
                  onClick={() => setConfirm(row)}
                >
                  Delete
                </Button>
              </div>
            </DataCell>
          </DataRow>
        ))}
      </DataList>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={`Delete "${confirm?.label ?? ""}"?`}
        description="The snapshot is removed. The project itself is not affected."
        confirmLabel="Delete"
        confirmVariant="danger"
        pending={pending}
        onConfirm={() => {
          if (confirm) remove(confirm);
        }}
      />
    </div>
  );
}
