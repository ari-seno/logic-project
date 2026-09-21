import type { NextRequest } from "next/server";

import { loadProjectBundle } from "@/lib/export/bundle";
import {
  buildExportFile,
  EXPORT_FORMATS,
  isExportFormat,
} from "@/lib/export/download";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");

  if (!isExportFormat(format)) {
    return Response.json(
      {
        error: "Unsupported export format.",
        formats: EXPORT_FORMATS,
      },
      { status: 400 },
    );
  }

  const bundle = await loadProjectBundle(id);
  if (!bundle) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const file = buildExportFile(bundle, format);

  return new Response(file.content, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
