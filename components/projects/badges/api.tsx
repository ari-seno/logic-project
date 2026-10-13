import { Pill } from "@/components/projects/badges/pill";
import type {
  ApiEndpointEntityRole,
  ApiHttpMethod,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

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
