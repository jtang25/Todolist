// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

type Params = { id: string };

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { id } = await ctx.params;

  const { data, error } = await supabaseServer
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { id } = await ctx.params;
  const body = await req.json();

  const updates: Record<string, any> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.notes === "string" || body.notes === null)
    updates.notes = body.notes;
  if (typeof body.status === "string") updates.status = body.status;
  if (typeof body.due_date === "string" || body.due_date === null)
    updates.due_date = body.due_date;

  const { data, error } = await supabaseServer
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { id } = await ctx.params;

  const { error } = await supabaseServer.from("tasks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
