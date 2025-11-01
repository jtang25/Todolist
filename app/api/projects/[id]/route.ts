// app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), "data", "projects"); // change if your stuff lives elsewhere

async function exists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function deletePhysical(id: string) {
  const asDir = path.join(ROOT, id);
  const asFile = path.join(ROOT, `${id}.json`);

  if (await exists(asDir)) {
    await fs.rm(asDir, { recursive: true, force: true });
    return true;
  }
  if (await exists(asFile)) {
    await fs.rm(asFile, { force: true });
    return true;
  }
  return false;
}

// ← THIS is the important part
function extractId(req: Request, params?: Record<string, string | undefined>) {
  // 1) try all the usual param names
  const fromParams =
    params?.id ??
    params?.projectId ??
    params?.project_uuid ??
    params?.project ??
    params?.pid;

  if (fromParams) return fromParams;

  // 2) fallback: read from URL path
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // e.g. /api/projects/123  -> ["api","projects","123"]
  const last = parts[parts.length - 1];
  if (!last || last === "projects") return undefined;
  return decodeURIComponent(last);
}

export async function DELETE(
  req: Request,
  ctx: { params?: Record<string, string | undefined> }
) {
  try {
    const id = extractId(req, ctx.params);

    // log what we're actually getting
    console.log("DELETE /api/projects/[id]", {
      gotParams: ctx.params,
      pathname: new URL(req.url).pathname,
      extracted: id,
    });

    if (!id) {
      return NextResponse.json(
        {
          error: "Missing id",
          debug: {
            params: ctx.params,
            pathname: new URL(req.url).pathname,
          },
        },
        { status: 400 }
      );
    }

    const removed = await deletePhysical(id);
    if (!removed) {
      return NextResponse.json(
        { error: "Not found", id },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err: any) {
    console.error("DELETE /api/projects/[id] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function HEAD(
  req: Request,
  ctx: { params?: Record<string, string | undefined> }
) {
  const id = extractId(req, ctx.params);
  if (!id) return new Response(null, { status: 400 });

  const present =
    (await exists(path.join(ROOT, id))) ||
    (await exists(path.join(ROOT, `${id}.json`)));

  return new Response(null, { status: present ? 200 : 404 });
}
