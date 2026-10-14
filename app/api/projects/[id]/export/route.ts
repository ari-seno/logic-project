import type { NextRequest } from "next/server";

import { loadProjectBundle } from "@/lib/export/bundle";
import {
  buildExportFile,
  EXPORT_FORMATS,
  isExportFormat,
} from "@/lib/export/download";
import {
  buildExportArchive,
  EXPORT_ARCHIVE_FORMAT,
} from "@/lib/export/zip";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");
  const wantsArchive = format === EXPORT_ARCHIVE_FORMAT;
  const availableFormats = [...EXPORT_FORMATS, EXPORT_ARCHIVE_FORMAT];

  if (!wantsArchive && !isExportFormat(format)) {
    return Response.json(
      {
        error: "Unsupported export format.",
        formats: availableFormats,
      },
      { status: 400 },
    );
  }

  const bundle = await loadProjectBundle(id);
  if (!bundle) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const generatedAt = new Date().toISOString();

  if (wantsArchive) {
    const archive = buildExportArchive(bundle, { generatedAt });
    const body = Uint8Array.from(archive.content).buffer;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": archive.contentType,
        "Content-Disposition": `attachment; filename="${archive.filename}"`,
        "Content-Length": String(archive.content.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }

  if (!isExportFormat(format)) {
    return Response.json({ error: "Unsupported export format." }, { status: 400 });
  }

  const file = buildExportFile(bundle, format, { generatedAt });

  return new Response(file.content, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
