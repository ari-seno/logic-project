"use client";

import { useActionState } from "react";

import {
  updateProfile,
} from "@/lib/profile/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileUpdateInput } from "@/lib/validation/profile";
import type { ProfileActionState } from "@/lib/validation/profile";

const initialState: ProfileActionState | null = null;

export function ProfileForm({
  email,
  display_name,
}: {
  email: string;
  display_name: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          value={email}
          readOnly
          className="bg-[var(--muted)] text-[var(--muted-foreground)]"
        />
        <p className="text-xs text-[var(--muted-foreground)]">
          Email is managed by your auth provider and cannot be changed here.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={display_name ?? ""}
          placeholder="How you'd like to be addressed"
          aria-invalid={
            Boolean(state?.fieldErrors?.display_name?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.display_name} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

// Re-export so server-side imports remain stable
export type { ProfileActionState, ProfileUpdateInput };
