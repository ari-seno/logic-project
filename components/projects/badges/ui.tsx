import { Pill } from "@/components/projects/badges/pill";
import type {
  UiComponentType,
  UiFieldType,
  UiScreenEntityRole,
  UiScreenType,
  UiStateType,
} from "@/lib/supabase/types";

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
