import { cn } from "@/lib/utils";
import type {
  ArchitectureComponentType,
  ArchitectureDecisionStatus,
  ArchitectureTechnologyCategory,
  DecisionStatus,
  EntityDataType,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  RelationshipType,
} from "@/lib/supabase/types";

function Pill({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TypeBadge({ type }: { type: RequirementType }) {
  const map: Record<RequirementType, { label: string; cls: string }> = {
    functional: {
      label: "Functional",
      cls: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    non_functional: {
      label: "Non-functional",
      cls: "bg-violet-50 text-violet-700 ring-violet-200",
    },
  };
  return <Pill className={map[type].cls}>{map[type].label}</Pill>;
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  const map: Record<RequirementStatus, { label: string; cls: string }> = {
    draft: {
      label: "Draft",
      cls: "bg-zinc-50 text-zinc-700 ring-zinc-200",
    },
    approved: {
      label: "Approved",
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-50 text-red-700 ring-red-200",
    },
    implemented: {
      label: "Implemented",
      cls: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    },
  };
  return <Pill className={map[status].cls}>{map[status].label}</Pill>;
}

export function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  const map: Record<RequirementPriority, { label: string; cls: string }> = {
    low: {
      label: "Low",
      cls: "bg-slate-50 text-slate-700 ring-slate-200",
    },
    medium: {
      label: "Medium",
      cls: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    high: {
      label: "High",
      cls: "bg-orange-50 text-orange-700 ring-orange-200",
    },
    critical: {
      label: "Critical",
      cls: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  };
  return <Pill className={map[priority].cls}>{map[priority].label}</Pill>;
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const map: Record<DecisionStatus, { label: string; cls: string }> = {
    proposed: {
      label: "Proposed",
      cls: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    accepted: {
      label: "Accepted",
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    superseded: {
      label: "Superseded",
      cls: "bg-zinc-50 text-zinc-500 ring-zinc-200",
    },
  };
  return <Pill className={map[status].cls}>{map[status].label}</Pill>;
}

export function DataTypeBadge({ dataType }: { dataType: EntityDataType }) {
  const cls =
    "bg-slate-50 text-slate-700 ring-slate-200 font-mono text-[11px] lowercase";
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
      cls: "bg-violet-50 text-violet-700 ring-violet-200",
    },
    one_to_many: {
      label: "1 → N",
      cls: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    },
    many_to_one: {
      label: "N → 1",
      cls: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    },
    many_to_many: {
      label: "N → N",
      cls: "bg-blue-50 text-blue-700 ring-blue-200",
    },
  };
  return <Pill className={map[type].cls}>{map[type].label}</Pill>;
}

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
  frontend: "bg-sky-50 text-sky-700 ring-sky-200",
  backend: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  database: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  authentication: "bg-rose-50 text-rose-700 ring-rose-200",
  storage: "bg-amber-50 text-amber-700 ring-amber-200",
  external_service: "bg-orange-50 text-orange-700 ring-orange-200",
  infrastructure: "bg-slate-50 text-slate-700 ring-slate-200",
  worker: "bg-violet-50 text-violet-700 ring-violet-200",
  queue: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  cache: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  other: "bg-zinc-50 text-zinc-700 ring-zinc-200",
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
  language: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  framework: "bg-violet-50 text-violet-700 ring-violet-200",
  database: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  authentication: "bg-rose-50 text-rose-700 ring-rose-200",
  hosting: "bg-sky-50 text-sky-700 ring-sky-200",
  infrastructure: "bg-slate-50 text-slate-700 ring-slate-200",
  testing: "bg-amber-50 text-amber-700 ring-amber-200",
  package: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  external_service: "bg-orange-50 text-orange-700 ring-orange-200",
  other: "bg-zinc-50 text-zinc-700 ring-zinc-200",
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
      cls: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    accepted: {
      label: "Accepted",
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    superseded: {
      label: "Superseded",
      cls: "bg-zinc-50 text-zinc-500 ring-zinc-200",
    },
  };
  return <Pill className={map[status].cls}>{map[status].label}</Pill>;
}
