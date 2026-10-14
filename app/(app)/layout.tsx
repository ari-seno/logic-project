import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/shell/command-palette";
import { Toaster } from "@/components/shell/toaster";
import { createClient, getUser } from "@/lib/supabase/server";

// The signed-in area is private; keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.deleted_at) {
    redirect("/account/restore");
  }

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "Account";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface-1)] lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-5 text-sm font-semibold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-accent)] text-white shadow-sm">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M3 3h10v2H3V3zm0 4h10v2H3V7zm0 4h7v2H3v-2z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="text-gradient">Logic Project</span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <AppSidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold tracking-tight lg:hidden"
              >
                <span className="text-gradient">Logic Project</span>
              </Link>
              <CommandPalette />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/account"
                className="hidden text-right text-xs leading-tight hover:underline sm:block"
                aria-label="Open account"
              >
                <p className="font-medium text-[var(--foreground)]">{displayName}</p>
                <p className="text-[var(--muted-foreground)]">{user.email}</p>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </div>
      </div>

      <Toaster />
    </div>
  );
}
