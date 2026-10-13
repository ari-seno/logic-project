import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Logic Project account.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const notice =
    params.error ??
    (params.deleted
      ? "Your account is scheduled for deletion. Sign in to restore it."
      : undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card-glass p-8">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[var(--brand)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              Welcome back
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Continue planning your project with Logic Project.
            </p>
          </div>
          <LoginForm notice={notice} />
          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[var(--brand-strong)] hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
