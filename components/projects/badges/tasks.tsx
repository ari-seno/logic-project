import { Pill } from "@/components/projects/badges/pill";
import type {
  TaskDependencyType,
  TaskEffort,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/supabase/types";

const TASK_STATUS_LABELS: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: "Todo", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  ready: { label: "Ready", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  in_progress: {
    label: "In progress",
    cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  },
  blocked: { label: "Blocked", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  review: { label: "Review", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  done: { label: "Done", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  cancelled: { label: "Cancelled", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Pill className={TASK_STATUS_LABELS[status].cls}>
      {TASK_STATUS_LABELS[status].label}
    </Pill>
  );
}

const TASK_PRIORITY_LABELS: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  medium: { label: "Medium", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  high: { label: "High", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  critical: { label: "Critical", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Pill className={TASK_PRIORITY_LABELS[priority].cls}>
      {TASK_PRIORITY_LABELS[priority].label}
    </Pill>
  );
}

const TASK_TYPE_LABELS: Record<TaskType, { label: string; cls: string }> = {
  feature: { label: "Feature", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  bug: { label: "Bug", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  refactor: { label: "Refactor", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  database: { label: "Database", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  backend: { label: "Backend", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  frontend: { label: "Frontend", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  infrastructure: {
    label: "Infrastructure",
    cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  },
  testing: {
    label: "Testing",
    cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
  },
  documentation: {
    label: "Documentation",
    cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
  },
  security: {
    label: "Security",
    cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  },
  other: { label: "Other", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
};

export function TaskTypeBadge({ type }: { type: TaskType }) {
  return (
    <Pill className={TASK_TYPE_LABELS[type].cls}>
      {TASK_TYPE_LABELS[type].label}
    </Pill>
  );
}

const TASK_EFFORT_LABELS: Record<TaskEffort, { label: string; cls: string }> = {
  xs: { label: "XS", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  s: { label: "S", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  m: { label: "M", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  l: { label: "L", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  xl: { label: "XL", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
};

export function TaskEffortBadge({ effort }: { effort: TaskEffort }) {
  return (
    <Pill className={TASK_EFFORT_LABELS[effort].cls}>
      {TASK_EFFORT_LABELS[effort].label}
    </Pill>
  );
}

const TASK_DEP_LABELS: Record<TaskDependencyType, { label: string; cls: string }> = {
  blocks: { label: "Blocks", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  related: {
    label: "Related",
    cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  },
};

export function TaskDependencyTypeBadge({
  type,
}: {
  type: TaskDependencyType;
}) {
  return (
    <Pill className={TASK_DEP_LABELS[type].cls}>
      {TASK_DEP_LABELS[type].label}
    </Pill>
  );
}

export function TaskBlockedBadge() {
  return (
    <Pill className="bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]">
      Blocked
    </Pill>
  );
}
