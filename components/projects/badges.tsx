import { cn } from "@/lib/utils";
import type {
  DecisionStatus,
  EntityDataType,
  RelationshipType,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
} from "@/lib/supabase/types";

const typeClasses: Record<RequirementType, string> = {
  functional: "bg-blue-50 text-blue-800 border-blue-200",
  non_functional: "bg-purple-50 text-purple-800 border-purple-200",
};

const requirementStatusClasses: Record<RequirementStatus, string> = {
  draft: "bg-zinc-100 text-zinc-800 border-zinc-200",
  approved: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
  implemented: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

const decisionStatusClasses: Record<DecisionStatus, string> = {
  proposed: "bg-amber-50 text-amber-800 border-amber-200",
  accepted: "bg-green-50 text-green-800 border-green-200",
  superseded: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const priorityClasses: Record<RequirementPriority, string> = {
  low: "bg-zinc-50 text-zinc-700 border-zinc-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-50 text-orange-800 border-orange-200",
  critical: "bg-red-50 text-red-800 border-red-200",
};

const dataTypeClasses: Record<EntityDataType, string> = {
  uuid: "bg-indigo-50 text-indigo-700 border-indigo-200",
  string: "bg-blue-50 text-blue-700 border-blue-200",
  text: "bg-sky-50 text-sky-700 border-sky-200",
  integer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  decimal: "bg-teal-50 text-teal-700 border-teal-200",
  boolean: "bg-amber-50 text-amber-700 border-amber-200",
  date: "bg-rose-50 text-rose-700 border-rose-200",
  datetime: "bg-pink-50 text-pink-700 border-pink-200",
  json: "bg-violet-50 text-violet-700 border-violet-200",
};

const relationshipTypeClasses: Record<RelationshipType, string> = {
  one_to_one: "bg-blue-50 text-blue-800 border-blue-200",
  one_to_many: "bg-emerald-50 text-emerald-800 border-emerald-200",
  many_to_one: "bg-amber-50 text-amber-800 border-amber-200",
  many_to_many: "bg-violet-50 text-violet-800 border-violet-200",
};

const base =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize";

export function TypeBadge({ type }: { type: RequirementType }) {
  return <span className={cn(base, typeClasses[type])}>{type.replace("_", " ")}</span>;
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  return (
    <span className={cn(base, requirementStatusClasses[status])}>{status}</span>
  );
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <span className={cn(base, decisionStatusClasses[status])}>{status}</span>
  );
}

export function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  return (
    <span className={cn(base, priorityClasses[priority])}>{priority}</span>
  );
}

export function DataTypeBadge({ dataType }: { dataType: EntityDataType }) {
  return (
    <span className={cn(base, dataTypeClasses[dataType])}>{dataType}</span>
  );
}

export function RelationshipTypeBadge({ type }: { type: RelationshipType }) {
  return (
    <span className={cn(base, relationshipTypeClasses[type])}>
      {type.replace(/_/g, " → ")}
    </span>
  );
}
