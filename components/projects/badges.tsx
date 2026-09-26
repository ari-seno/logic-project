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
  TaskDependencyType,
  TaskEffort,
  TaskPriority,
  TaskStatus,
  TaskType,
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

const API_METHOD_LABELS: Record<ApiHttpMethod, { label: string; cls: string }> = {
  GET: {
    label: "GET",
    cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
  },
  POST: {
    label: "POST",
    cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  },
  PUT: {
    label: "PUT",
    cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  },
  PATCH: {
    label: "PATCH",
    cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  },
  DELETE: {
    label: "DELETE",
    cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
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
    <Pill className="bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]">
      Auth required
    </Pill>
  ) : (
    <Pill className="bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]">Public</Pill>
  );
}

export function ApiStatusCodeBadge({
  statusCode,
}: {
  statusCode: number;
}) {
  let cls = "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]";
  if (statusCode >= 200 && statusCode < 300) {
    cls = "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]";
  } else if (statusCode >= 300 && statusCode < 400) {
    cls = "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]";
  } else if (statusCode >= 400 && statusCode < 500) {
    cls = "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]";
  } else if (statusCode >= 500) {
    cls = "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]";
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
    cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]",
  },
  request_resource: {
    label: "Request",
    cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]",
  },
  response_resource: {
    label: "Response",
    cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]",
  },
  related_resource: {
    label: "Related",
    cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]",
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
    <Pill className="bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]">Required</Pill>
  ) : (
    <Pill className="bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]">Optional</Pill>
  );
}

const UI_SCREEN_TYPE_LABELS: Record<UiScreenType, { label: string; cls: string }> = {
  page: { label: "Page", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  modal: { label: "Modal", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  drawer: { label: "Drawer", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  dialog: { label: "Dialog", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  wizard: { label: "Wizard", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  dashboard: { label: "Dashboard", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  form: { label: "Form", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  list: { label: "List", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  detail: { label: "Detail", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  settings: { label: "Settings", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  authentication: {
    label: "Authentication",
    cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  },
  error: { label: "Error", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  other: { label: "Other", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
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
  layout: { label: "Layout", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  navigation: { label: "Navigation", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  header: { label: "Header", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  footer: { label: "Footer", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  sidebar: { label: "Sidebar", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  card: { label: "Card", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  table: { label: "Table", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  list: { label: "List", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  form: { label: "Form", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  input: { label: "Input", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  textarea: { label: "Textarea", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  select: { label: "Select", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  checkbox: { label: "Checkbox", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  radio: { label: "Radio", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  button: { label: "Button", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  modal: { label: "Modal", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  dialog: { label: "Dialog", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  drawer: { label: "Drawer", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  tabs: { label: "Tabs", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  badge: { label: "Badge", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  alert: { label: "Alert", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  notification: {
    label: "Notification",
    cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]",
  },
  chart: { label: "Chart", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  custom: { label: "Custom", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  other: { label: "Other", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
};

export function UiComponentTypeBadge({ type }: { type: UiComponentType }) {
  return (
    <Pill className={UI_COMPONENT_TYPE_LABELS[type].cls}>
      {UI_COMPONENT_TYPE_LABELS[type].label}
    </Pill>
  );
}

const UI_FIELD_TYPE_LABELS: Record<UiFieldType, { label: string; cls: string }> = {
  text: { label: "Text", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  textarea: { label: "Textarea", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  email: { label: "Email", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  password: { label: "Password", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  number: { label: "Number", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  date: { label: "Date", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  datetime: { label: "Datetime", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  select: { label: "Select", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  checkbox: { label: "Checkbox", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  radio: { label: "Radio", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  file: { label: "File", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  hidden: { label: "Hidden", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  other: { label: "Other", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
};

export function UiFieldTypeBadge({ type }: { type: UiFieldType }) {
  return (
    <Pill className={UI_FIELD_TYPE_LABELS[type].cls}>
      {UI_FIELD_TYPE_LABELS[type].label}
    </Pill>
  );
}

const UI_STATE_TYPE_LABELS: Record<UiStateType, { label: string; cls: string }> = {
  default: { label: "Default", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  loading: { label: "Loading", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  empty: { label: "Empty", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  success: { label: "Success", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  error: { label: "Error", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  disabled: { label: "Disabled", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  unauthorized: {
    label: "Unauthorized",
    cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  },
  forbidden: { label: "Forbidden", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  not_found: { label: "Not found", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  validation_error: {
    label: "Validation",
    cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]",
  },
  offline: { label: "Offline", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
  custom: { label: "Custom", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
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
  displayed: { label: "Displayed", cls: "bg-[var(--info-bg)] text-[var(--info-fg)] ring-[var(--info-border)]" },
  created: { label: "Created", cls: "bg-[var(--success-bg)] text-[var(--success-fg)] ring-[var(--success-border)]" },
  edited: { label: "Edited", cls: "bg-[var(--warning-bg)] text-[var(--warning-fg)] ring-[var(--warning-border)]" },
  deleted: { label: "Deleted", cls: "bg-[var(--danger-bg)] text-[var(--danger-fg)] ring-[var(--danger-border)]" },
  filtered: { label: "Filtered", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  selected: { label: "Selected", cls: "bg-[var(--brand-bg)] text-[var(--brand-fg)] ring-[var(--brand-border)]" },
  related: { label: "Related", cls: "bg-[var(--neutral-bg)] text-[var(--neutral-fg)] ring-[var(--neutral-border)]" },
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
