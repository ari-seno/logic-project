import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ProfileForm } from "@/components/account/profile-form";
import { getCurrentProfile } from "@/lib/profile/queries";
import { CredentialsSection } from "@/components/account/settings/ai/credentials-section";
import { listMyCredentialsAction } from "@/lib/ai/credentials-actions";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  const credentials = await listMyCredentialsAction();

  if (!profile) {
    return (
      <div className="card-glass text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Unable to load your profile. Please sign in again.
        </p>
      </div>
    );
  }

  const credCount = credentials.ok ? credentials.credentials.length : 0;

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
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Profile and AI integrations for your account.
        </p>
      </div>

      {sp.updated === "1" ? (
        <Alert variant="success">Profile updated.</Alert>
      ) : null}

      <section className="card-glass">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Profile
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Your display name appears across projects.
            </p>
          </div>
        </header>
        <div className="mt-5">
          <ProfileForm
            email={profile.email}
            display_name={profile.display_name}
          />
        </div>
        <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
          Password and sign-out controls are managed by your auth provider.
          Use the sign-out button in the header to end your current session.
        </p>
      </section>

      <section className="card-glass">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">
                AI credentials
              </h2>
              {credCount > 0 ? (
                <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--brand)]">
                  {credCount} active
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Ollama API keys for generating requirements on each project.
              Keys are stored encrypted (AES-256-GCM).
            </p>
          </div>
        </header>
        <div className="mt-5">
          <CredentialsSection
            initialCredentials={
              credentials.ok ? credentials.credentials : []
            }
          />
        </div>
      </section>
    </div>
  );
}
