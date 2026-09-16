import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "Account";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-semibold tracking-tight"
            >
              Logic Project
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-[var(--muted-foreground)] sm:flex">
              <Link
                href="/dashboard"
                className="hover:text-[var(--foreground)]"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="hover:text-[var(--foreground)]"
              >
                Projects
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs leading-tight sm:block">
              <p className="font-medium">{displayName}</p>
              <p className="text-[var(--muted-foreground)]">
                {user.email}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
