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
      <header className="sticky top-0 z-20 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-accent)] text-white shadow-sm">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path
                    d="M3 3h10v2H3V3zm0 4h10v2H3V7zm0 4h7v2H3v-2z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="text-gradient">Logic Project</span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm text-[var(--muted-foreground)] sm:flex">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="rounded-md px-3 py-1.5 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Projects
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs leading-tight sm:block">
              <p className="font-medium text-[var(--foreground)]">{displayName}</p>
              <p className="text-[var(--muted-foreground)]">{user.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
