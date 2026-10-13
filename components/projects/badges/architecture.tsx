import { Pill } from "@/components/projects/badges/pill";
import type {
  ArchitectureComponentType,
  ArchitectureDecisionStatus,
  ArchitectureTechnologyCategory,
} from "@/lib/supabase/types";

const COMPONENT_TYPE_LABELS: Record<ArchitectureComponentType, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  authentication: "Authentication",
  storage: "Storage",
  external_service: "External Service",
  infrastructure: "Infrastructure",
  worker: "Worker",
  queue: "Queue",
  cache: "Cache",
  other: "Other",
};

const COMPONENT_TYPE_CLASSES: Record<ArchitectureComponentType, string> = {
  frontend: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  backend: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  database: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
  authentication: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  storage: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  external_service: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  infrastructure: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
  worker: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  queue: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  cache: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  other: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
};

export function ArchitectureComponentTypeBadge({
  type,
}: {
  type: ArchitectureComponentType;
}) {
  return (
    <Pill className={COMPONENT_TYPE_CLASSES[type]}>
      {COMPONENT_TYPE_LABELS[type]}
    </Pill>
  );
}

const TECHNOLOGY_CATEGORY_LABELS: Record<ArchitectureTechnologyCategory, string> = {
  language: "Language",
  framework: "Framework",
  database: "Database",
  authentication: "Authentication",
  hosting: "Hosting",
  infrastructure: "Infrastructure",
  testing: "Testing",
  package: "Package",
  external_service: "External Service",
  other: "Other",
};

const TECHNOLOGY_CATEGORY_CLASSES: Record<ArchitectureTechnologyCategory, string> = {
  language: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  framework: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  database: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
  authentication: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  hosting: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  infrastructure: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
  testing: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  package: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  external_service: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  other: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
};

export function ArchitectureTechnologyCategoryBadge({
  category,
}: {
  category: ArchitectureTechnologyCategory;
}) {
  return (
    <Pill className={TECHNOLOGY_CATEGORY_CLASSES[category]}>
      {TECHNOLOGY_CATEGORY_LABELS[category]}
    </Pill>
  );
}

export function ArchitectureDecisionStatusBadge({
  status,
}: {
  status: ArchitectureDecisionStatus;
}) {
  const map: Record<ArchitectureDecisionStatus, { label: string; cls: string }> = {
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
