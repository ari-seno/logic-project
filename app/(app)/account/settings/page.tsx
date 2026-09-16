import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ProfileForm } from "@/components/account/profile-form";
import { getCurrentProfile } from "@/lib/profile/queries";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="card-glass text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Unable to load your profile. Please sign in again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/account"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to account
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Update your profile display name.
        </p>
      </div>

      {sp.updated === "1" ? (
        <Alert variant="success">Profile updated.</Alert>
      ) : null}

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Profile
        </h2>
        <div className="mt-4">
          <ProfileForm
            email={profile.email}
            display_name={profile.display_name}
          />
        </div>
      </section>

      <section className="card-glass">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Account security
        </h2>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          Password changes and sign-out controls are managed by your auth
          provider. Use the sign-out button in the header to end your
          current session.
        </p>
      </section>
    </div>
  );
}
