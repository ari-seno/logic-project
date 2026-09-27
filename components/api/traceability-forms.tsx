"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  attachEntityToEndpoint,
  attachRequirementToEndpoint,
  detachEntityFromEndpoint,
  detachRequirementFromEndpoint,
} from "@/lib/api/endpoints/traceability-actions";
import {
  API_ENDPOINT_ENTITY_ROLES,
  type ApiEndpointEntityRole,
} from "@/lib/supabase/types";
import type { LinkedEntity } from "@/lib/api/endpoints/queries";

export function AttachEntityForm({
  endpointId,
  entities,
}: {
  endpointId: string;
  entities: { id: string; name: string }[];
}) {
  const [, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await attachEntityToEndpoint(formData);
      if (result && "error" in result) {
        toast.error(result.error);
      }
    });
  }

  if (entities.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Create a domain entity first to link it to this endpoint.
      </p>
    );
  }

  return (
    <form action={handleAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="endpointId" value={endpointId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="entity-select">
          Domain entity
        </label>
        <Select id="entity-select" name="entityId" required>
          <option value="">Select…</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="entity-role">
          Role
        </label>
        <Select id="entity-role" name="role" defaultValue="response_resource">
          {API_ENDPOINT_ENTITY_ROLES.map((r) => (
            <option key={r} value={r}>
              {labelRole(r)}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm">
        Attach
      </Button>
    </form>
  );
}

export function AttachRequirementForm({
  endpointId,
  requirements,
}: {
  endpointId: string;
  requirements: { id: string; title: string }[];
}) {
  const [, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await attachRequirementToEndpoint(formData);
      if (result && "error" in result) {
        toast.error(result.error);
      }
    });
  }

  if (requirements.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Add a requirement first to link it to this endpoint.
      </p>
    );
  }

  return (
    <form action={handleAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="endpointId" value={endpointId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="req-select">
          Requirement
        </label>
        <Select id="req-select" name="requirementId" required>
          <option value="">Select…</option>
          {requirements.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm">
        Link
      </Button>
    </form>
  );
}

export function DetachEntityButton({
  link,
  endpointId,
}: {
  link: LinkedEntity;
  endpointId: string;
}) {
  const [, startTransition] = useTransition();
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("id", link.id);
    fd.set("endpointId", endpointId);
    startTransition(async () => {
      const result = await detachEntityFromEndpoint(fd);
      if (result && "error" in result) toast.error(result.error);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Detach
    </Button>
  );
}

export function DetachRequirementButton({
  link,
  endpointId,
}: {
  link: { id: string };
  endpointId: string;
}) {
  const [, startTransition] = useTransition();
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("id", link.id);
    fd.set("endpointId", endpointId);
    startTransition(async () => {
      const result = await detachRequirementFromEndpoint(fd);
      if (result && "error" in result) toast.error(result.error);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Detach
    </Button>
  );
}

function labelRole(role: ApiEndpointEntityRole): string {
  switch (role) {
    case "primary_resource":
      return "Primary resource";
    case "request_resource":
      return "Request resource";
    case "response_resource":
      return "Response resource";
    case "related_resource":
      return "Related resource";
  }
}
