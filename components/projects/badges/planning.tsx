import { Pill } from "@/components/projects/badges/pill";
import type {
  DecisionStatus,
  EntityDataType,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  RelationshipType,
} from "@/lib/supabase/types";

export function TypeBadge({ type }: { type: RequirementType }) {
  const map: Record<RequirementType, { label: string; cls: string }> = {
    functional: {
      label: "Functional",
      cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
    },
    non_functional: {
      label: "Non-functional",
      cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
    },
  };
  return <Pill className={map[type].cls}>{map[type].label}</Pill>;
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  const map: Record<RequirementStatus, { label: string; cls: string }> = {
    draft: {
      label: "Draft",
      cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
    },
    approved: {
      label: "Approved",
      cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
    },
    implemented: {
      label: "Implemented",
      cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
    },
  };
  return <Pill className={map[status].cls}>{map[status].label}</Pill>;
}

export function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  const map: Record<RequirementPriority, { label: string; cls: string }> = {
    low: {
      label: "Low",
      cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
    },
    medium: {
      label: "Medium",
      cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
    },
    high: {
      label: "High",
      cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
    },
    critical: {
      label: "Critical",
      cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
    },
  };
  return <Pill className={map[priority].cls}>{map[priority].label}</Pill>;
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const map: Record<DecisionStatus, { label: string; cls: string }> = {
    proposed: {
      label: "Proposed",
      cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
    },
    accepted: {
      label: "Accepted",
      cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
    },
    superseded: {
      label: "Superseded",
      cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
    },
  };
  return <Pill className={map[status].cls}>{map[status].label}</Pill>;
}

export function DataTypeBadge({ dataType }: { dataType: EntityDataType }) {
  const cls =
    "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)] font-mono text-[11px] lowercase";
  return <Pill className={cls}>{dataType}</Pill>;
}

export function RelationshipTypeBadge({
  type,
}: {
  type: RelationshipType;
}) {
  const map: Record<RelationshipType, { label: string; cls: string }> = {
    one_to_one: {
      label: "1 → 1",
      cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
    },
    one_to_many: {
      label: "1 → N",
      cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
    },
    many_to_one: {
      label: "N → 1",
      cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
    },
    many_to_many: {
      label: "N → N",
      cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
    },
  };
  return <Pill className={map[type].cls}>{map[type].label}</Pill>;
}
