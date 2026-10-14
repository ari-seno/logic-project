"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  TaskBlockedBadge,
  TaskPriorityBadge,
  TaskTypeBadge,
} from "@/components/projects/badges";
import { Select } from "@/components/ui/select";
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/supabase/types";
import { updateTaskStatus } from "@/lib/tasks/actions";

export type BoardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  taskType: TaskType;
  priority: TaskPriority;
  blocked: boolean;
  updatedLabel: string;
};

export type BoardColumn = { key: TaskStatus; label: string };

export function TaskBoard({
  projectId,
  columns,
  tasks,
}: {
  projectId: string;
  columns: BoardColumn[];
  tasks: BoardTask[];
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(taskId: string, status: TaskStatus) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;
    setMovingId(taskId);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", taskId);
      formData.set("status", status);
      const result = await updateTaskStatus(formData);
      if ("error" in result) toast.error(result.error);
      setMovingId(null);
    });
  }

  const byColumn = new Map<string, BoardTask[]>();
  for (const column of columns) byColumn.set(column.key, []);
  for (const task of tasks) byColumn.get(task.status)?.push(task);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {columns.map((column) => {
        const items = byColumn.get(column.key) ?? [];
        const isOver = overColumn === column.key;
        return (
          <section
            key={column.key}
            aria-label={column.label}
            onDragOver={(event) => {
              event.preventDefault();
              setOverColumn(column.key);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData("text/plain");
              setOverColumn(null);
              setDragging(null);
              if (taskId) move(taskId, column.key);
            }}
            className={`flex flex-col gap-2 rounded-[var(--radius-lg)] border p-3 transition-colors ${
              isOver
                ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                : "border-[var(--border)] bg-[var(--surface-1)]"
            }`}
          >
            <header className="flex items-center justify-between">
              <h2 className="text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {column.label}
              </h2>
              <span className="text-xs text-[var(--muted-foreground)]">
                {items.length}
              </span>
            </header>

            {items.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                No tasks in this column.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((task) => (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragging(task.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className={`rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-2 text-sm ${
                      dragging === task.id ? "opacity-50" : ""
                    } ${movingId === task.id ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TaskTypeBadge type={task.taskType} />
                      <TaskPriorityBadge priority={task.priority} />
                      {task.blocked ? <TaskBlockedBadge /> : null}
                    </div>
                    <Link
                      href={`/projects/${projectId}/tasks/${task.id}`}
                      className="mt-1 block font-medium hover:underline"
                    >
                      {task.title}
                    </Link>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {task.updatedLabel}
                      </span>
                      <Select
                        aria-label={`Move ${task.title}`}
                        className="w-auto"
                        value={task.status}
                        disabled={movingId === task.id}
                        onChange={(event) =>
                          move(task.id, event.target.value as TaskStatus)
                        }
                      >
                        {columns.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
