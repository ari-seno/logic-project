"use client";

export default function GlobalError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main className="flex min-h-screen items-center justify-center px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
