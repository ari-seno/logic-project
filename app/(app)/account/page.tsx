import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/profile/queries";
import { formatDate } from "@/lib/utils";

export default async function AccountPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="card-glass text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Unable to load your profile. Please sign in again.
        </p>
        <div className="mt-4">
          <ButtonLink href="/login">Sign in</ButtonLink>
        </div>
      </div>
    );
  }

  const initials = (profile.display_name ?? profile.email)
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Profile, membership, and account metadata.
        </p>
      </div>

      <section className="card-glass flex flex-wrap items-center gap-4 p-6">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-accent)] text-xl font-semibold text-white shadow-sm"
        >
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">
            {profile.display_name ?? "(no display name)"}
          </p>
          <p className="truncate text-sm text-[var(--muted-foreground)]">
            {profile.email}
          </p>
        </div>
        <Link
          href="/account/settings"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          Edit settings →
        </Link>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Profile
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              Display name
            </dt>
            <dd className="mt-1">
              {profile.display_name ?? (
                <span className="italic text-[var(--muted-foreground)]">
                  Not set
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              Email
            </dt>
            <dd className="mt-1">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              User ID
            </dt>
            <dd className="mt-1 font-mono text-xs">{profile.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              Member since
            </dt>
            <dd className="mt-1">{formatDate(profile.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              Profile updated
            </dt>
            <dd className="mt-1">{formatDate(profile.updated_at)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
