import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Lightweight liveness/readiness probe. Reports 200 when the database answers
// and 503 when it does not, so uptime monitors and the deploy pipeline can tell
// a running app from a broken one. No auth is required and nothing sensitive is
// returned.
export async function GET() {
  const startedAt = Date.now();

  let database: "ok" | "unreachable" = "ok";
  let databaseError: string | null = null;

  try {
    const supabase = await createClient();
    // An exact head count needs no rows back; RLS simply filters the count.
    const { error } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true });

    if (error) {
      database = "unreachable";
      databaseError = error.message;
    }
  } catch (error) {
    database = "unreachable";
    databaseError = error instanceof Error ? error.message : "Unknown error";
  }

  const healthy = database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      time: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      checks: { database },
      ...(databaseError ? { error: databaseError } : {}),
    },
    { status: healthy ? 200 : 503 },
  );
}
