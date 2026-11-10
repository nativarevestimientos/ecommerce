import { NextResponse } from "next/server";
import { mkdir, appendFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const body = payload ? JSON.parse(payload) : {};
    const sessionId = String(body?.sessionId || "default").trim() || "default";
    const outDir = path.join(process.cwd(), ".dbg");
    const filePath = path.join(outDir, `trae-debug-log-${sessionId}.ndjson`);
    await mkdir(outDir, { recursive: true });
    await appendFile(
      filePath,
      `${JSON.stringify({
        ...body,
        ts: Number(body?.ts || Date.now()),
      })}\n`,
      "utf8",
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo guardar el evento de debug",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
