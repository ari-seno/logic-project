"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--brand)]">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium underline"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
