"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  attachEndpointToInteraction,
  detachEndpointFromInteraction,
} from "@/lib/ui/traceability/actions";
import {
  attachEntityToScreen,
  attachRequirementToScreen,
  detachEntityFromScreen,
  detachRequirementFromScreen,
} from "@/lib/ui/traceability/actions";
import {
  UI_SCREEN_ENTITY_ROLES,
  type UiScreenEntityRole,
} from "@/lib/supabase/types";

export function AttachEndpointForm({
  interactionId,
  endpoints,
}: {
  interactionId: string;
  endpoints: { id: string; method: string; path: string; name: string }[];
}) {
  const [, startTransition] = useTransition();
  function handleAction(formData: FormData) {
    startTransition(async () => {
      const r = await attachEndpointToInteraction(formData);
      if (r && "error" in r) alert(r.error);
    });
  }
  if (endpoints.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Define endpoints in the project API module first.
      </p>
    );
  }
  return (
    <form action={handleAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="interactionId" value={interactionId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" htmlFor="endpoint-select">
          API endpoint
        </label>
        <Select id="endpoint-select" name="endpointId" required>
          <option value="">Select…</option>
          {endpoints.map((e) => (
            <option key={e.id} value={e.id}>
              {e.method} {e.path} ({e.name})
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

export function DetachEndpointButton({
  link,
  interactionId,
}: {
  link: { id: string };
  interactionId: string;
}) {
  const [, startTransition] = useTransition();
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("id", link.id);
    fd.set("interactionId", interactionId);
    startTransition(async () => {
      const r = await detachEndpointFromInteraction(fd);
      if (r && "error" in r) alert(r.error);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Detach
    </Button>
  );
}

export function AttachRequirementForm({
  screenId,
  requirements,
}: {
  screenId: string;
  requirements: { id: string; title: string }[];
}) {
  const [, startTransition] = useTransition();
  function handleAction(formData: FormData) {
    startTransition(async () => {
      const r = await attachRequirementToScreen(formData);
      if (r && "error" in r) alert(r.error);
    });
  }
  if (requirements.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Add a requirement first to link it to this screen.
      </p>
    );
  }
  return (
    <form action={handleAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="screenId" value={screenId} />
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

export function AttachEntityForm({
  screenId,
  entities,
}: {
  screenId: string;
  entities: { id: string; name: string }[];
}) {
  const [, startTransition] = useTransition();
  function handleAction(formData: FormData) {
    startTransition(async () => {
      const r = await attachEntityToScreen(formData);
      if (r && "error" in r) alert(r.error);
    });
  }
  if (entities.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Create a domain entity first to link it to this screen.
      </p>
    );
  }
  return (
    <form action={handleAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="screenId" value={screenId} />
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
        <label className="text-xs font-medium" htmlFor="ui-entity-role">
          Role
        </label>
        <Select
          id="ui-entity-role"
          name="role"
          defaultValue="displayed"
        >
          {UI_SCREEN_ENTITY_ROLES.map((r) => (
            <option key={r} value={r}>
              {labelUiRole(r)}
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

export function DetachRequirementButton({
  link,
  screenId,
}: {
  link: { id: string };
  screenId: string;
}) {
  const [, startTransition] = useTransition();
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("id", link.id);
    fd.set("screenId", screenId);
    startTransition(async () => {
      const r = await detachRequirementFromScreen(fd);
      if (r && "error" in r) alert(r.error);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Detach
    </Button>
  );
}

export function DetachEntityButton({
  link,
  screenId,
}: {
  link: { id: string };
  screenId: string;
}) {
  const [, startTransition] = useTransition();
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("id", link.id);
    fd.set("screenId", screenId);
    startTransition(async () => {
      const r = await detachEntityFromScreen(fd);
      if (r && "error" in r) alert(r.error);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Detach
    </Button>
  );
}

function labelUiRole(role: UiScreenEntityRole) {
  switch (role) {
    case "displayed":
      return "Displayed";
    case "created":
      return "Created";
    case "edited":
      return "Edited";
    case "deleted":
      return "Deleted";
    case "filtered":
      return "Filtered";
    case "selected":
      return "Selected";
    case "related":
      return "Related";
  }
}
