import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/profile/queries";
import { restoreAccount } from "@/lib/account/actions";
import { signOut } from "@/lib/auth/actions";
import { formatDate } from "@/lib/utils";

export default async function RestoreAccountPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.deleted_at) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card-glass p-8">
          <h1 className="text-lg font-semibold tracking-tight">
            Account scheduled for deletion
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Your account and everything in it are hidden from the app. They are
            permanently deleted on{" "}
            <span className="font-medium text-[var(--foreground)]">
              {profile.purge_after ? formatDate(profile.purge_after) : "—"}
            </span>
            .
          </p>

          <form action={restoreAccount} className="mt-6">
            <Button type="submit" variant="primary" size="md" className="w-full">
              Restore my account
            </Button>
          </form>

          <div className="mt-4 flex justify-center">
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Sign out instead
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
