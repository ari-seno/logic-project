import { cn } from "@/lib/utils";
import type {
  ApiEndpointEntityRole,
  ApiHttpMethod,
  ArchitectureComponentType,
  ArchitectureDecisionStatus,
  ArchitectureTechnologyCategory,
  DecisionStatus,
  EntityDataType,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  RelationshipType,
  UiComponentType,
  UiFieldType,
  UiScreenEntityRole,
  UiScreenType,
  UiStateType,
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

const API_METHOD_LABELS: Record<ApiHttpMethod, { label: string; cls: string }> = {
  GET: {
    label: "GET",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  POST: {
    label: "POST",
    cls: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  PUT: {
    label: "PUT",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  PATCH: {
    label: "PATCH",
    cls: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  DELETE: {
    label: "DELETE",
    cls: "bg-red-50 text-red-700 ring-red-200",
  },
};

export function ApiMethodBadge({ method }: { method: ApiHttpMethod }) {
  return (
    <Pill className={cn("font-mono", API_METHOD_LABELS[method].cls)}>
      {API_METHOD_LABELS[method].label}
    </Pill>
  );
}

export function ApiAuthBadge({
  required,
}: {
  required: boolean;
}) {
  return required ? (
    <Pill className="bg-amber-50 text-amber-700 ring-amber-200">
      Auth required
    </Pill>
  ) : (
    <Pill className="bg-zinc-50 text-zinc-500 ring-zinc-200">Public</Pill>
  );
}

export function ApiStatusCodeBadge({
  statusCode,
}: {
  statusCode: number;
}) {
  let cls = "bg-zinc-50 text-zinc-700 ring-zinc-200";
  if (statusCode >= 200 && statusCode < 300) {
    cls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (statusCode >= 300 && statusCode < 400) {
    cls = "bg-amber-50 text-amber-700 ring-amber-200";
  } else if (statusCode >= 400 && statusCode < 500) {
    cls = "bg-red-50 text-red-700 ring-red-200";
  } else if (statusCode >= 500) {
    cls = "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return (
    <Pill className={cn("font-mono", cls)}>{statusCode}</Pill>
  );
}

const API_ENTITY_ROLE_LABELS: Record<
  ApiEndpointEntityRole,
  { label: string; cls: string }
> = {
  primary_resource: {
    label: "Primary",
    cls: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  request_resource: {
    label: "Request",
    cls: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  response_resource: {
    label: "Response",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  related_resource: {
    label: "Related",
    cls: "bg-zinc-50 text-zinc-500 ring-zinc-200",
  },
};

export function ApiEntityRoleBadge({
  role,
}: {
  role: ApiEndpointEntityRole;
}) {
  return (
    <Pill className={API_ENTITY_ROLE_LABELS[role].cls}>
      {API_ENTITY_ROLE_LABELS[role].label}
    </Pill>
  );
}

export function ApiRequiredBadge({
  required,
}: {
  required: boolean;
}) {
  return required ? (
    <Pill className="bg-blue-50 text-blue-700 ring-blue-200">Required</Pill>
  ) : (
    <Pill className="bg-zinc-50 text-zinc-500 ring-zinc-200">Optional</Pill>
  );
}

const UI_SCREEN_TYPE_LABELS: Record<UiScreenType, { label: string; cls: string }> = {
  page: { label: "Page", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  modal: { label: "Modal", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  drawer: { label: "Drawer", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  dialog: { label: "Dialog", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  wizard: { label: "Wizard", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  dashboard: { label: "Dashboard", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  form: { label: "Form", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  list: { label: "List", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  detail: { label: "Detail", cls: "bg-teal-50 text-teal-700 ring-teal-200" },
  settings: { label: "Settings", cls: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  authentication: {
    label: "Authentication",
    cls: "bg-red-50 text-red-700 ring-red-200",
  },
  error: { label: "Error", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  other: { label: "Other", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
};

export function UiScreenTypeBadge({ type }: { type: UiScreenType }) {
  return (
    <Pill className={UI_SCREEN_TYPE_LABELS[type].cls}>
      {UI_SCREEN_TYPE_LABELS[type].label}
    </Pill>
  );
}

const UI_COMPONENT_TYPE_LABELS: Record<
  UiComponentType,
  { label: string; cls: string }
> = {
  layout: { label: "Layout", cls: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  navigation: { label: "Navigation", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  header: { label: "Header", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  footer: { label: "Footer", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  sidebar: { label: "Sidebar", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  card: { label: "Card", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  table: { label: "Table", cls: "bg-teal-50 text-teal-700 ring-teal-200" },
  list: { label: "List", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  form: { label: "Form", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  input: { label: "Input", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  textarea: { label: "Textarea", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  select: { label: "Select", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  checkbox: { label: "Checkbox", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  radio: { label: "Radio", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  button: { label: "Button", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  modal: { label: "Modal", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  dialog: { label: "Dialog", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  drawer: { label: "Drawer", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  tabs: { label: "Tabs", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  badge: { label: "Badge", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
  alert: { label: "Alert", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  notification: {
    label: "Notification",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  chart: { label: "Chart", cls: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200" },
  custom: { label: "Custom", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
  other: { label: "Other", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
};

export function UiComponentTypeBadge({ type }: { type: UiComponentType }) {
  return (
    <Pill className={UI_COMPONENT_TYPE_LABELS[type].cls}>
      {UI_COMPONENT_TYPE_LABELS[type].label}
    </Pill>
  );
}

const UI_FIELD_TYPE_LABELS: Record<UiFieldType, { label: string; cls: string }> = {
  text: { label: "Text", cls: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  textarea: { label: "Textarea", cls: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  email: { label: "Email", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  password: { label: "Password", cls: "bg-red-50 text-red-700 ring-red-200" },
  number: { label: "Number", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  date: { label: "Date", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  datetime: { label: "Datetime", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  select: { label: "Select", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  checkbox: { label: "Checkbox", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  radio: { label: "Radio", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  file: { label: "File", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  hidden: { label: "Hidden", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
  other: { label: "Other", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
};

export function UiFieldTypeBadge({ type }: { type: UiFieldType }) {
  return (
    <Pill className={UI_FIELD_TYPE_LABELS[type].cls}>
      {UI_FIELD_TYPE_LABELS[type].label}
    </Pill>
  );
}

const UI_STATE_TYPE_LABELS: Record<UiStateType, { label: string; cls: string }> = {
  default: { label: "Default", cls: "bg-zinc-50 text-zinc-700 ring-zinc-200" },
  loading: { label: "Loading", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  empty: { label: "Empty", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
  success: { label: "Success", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  error: { label: "Error", cls: "bg-red-50 text-red-700 ring-red-200" },
  disabled: { label: "Disabled", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
  unauthorized: {
    label: "Unauthorized",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  forbidden: { label: "Forbidden", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  not_found: { label: "Not found", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  validation_error: {
    label: "Validation",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  offline: { label: "Offline", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
  custom: { label: "Custom", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
};

export function UiStateTypeBadge({ type }: { type: UiStateType }) {
  return (
    <Pill className={UI_STATE_TYPE_LABELS[type].cls}>
      {UI_STATE_TYPE_LABELS[type].label}
    </Pill>
  );
}

const UI_ENTITY_ROLE_LABELS: Record<
  UiScreenEntityRole,
  { label: string; cls: string }
> = {
  displayed: { label: "Displayed", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  created: { label: "Created", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  edited: { label: "Edited", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  deleted: { label: "Deleted", cls: "bg-red-50 text-red-700 ring-red-200" },
  filtered: { label: "Filtered", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  selected: { label: "Selected", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  related: { label: "Related", cls: "bg-zinc-50 text-zinc-500 ring-zinc-200" },
};

export function UiScreenEntityRoleBadge({
  role,
}: {
  role: UiScreenEntityRole;
}) {
  return (
    <Pill className={UI_ENTITY_ROLE_LABELS[role].cls}>
      {UI_ENTITY_ROLE_LABELS[role].label}
    </Pill>
  );
}
