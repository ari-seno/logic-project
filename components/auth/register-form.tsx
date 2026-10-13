"use client";

import { useActionState } from "react";

import { signUp } from "@/lib/auth/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/lib/validation/auth";

const initialState: AuthActionState | null = null;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state?.message ? <Alert variant="success">{state.message}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state?.fieldErrors?.email?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state?.fieldErrors?.password?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={
            Boolean(state?.fieldErrors?.confirmPassword?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.confirmPassword} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
