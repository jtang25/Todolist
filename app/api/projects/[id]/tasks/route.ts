// app/api/projects/[id]/tasks/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

// GET all tasks for a project
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params; // 👈 Next 16: await params

  const { data, error } = await supabaseServer
    .from("tasks")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET /api/projects/[id]/tasks", error);
    return NextResponse.json(
      { error: "failed_to_fetch_tasks", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

// POST create task under a project
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json();

  const { title, notes, due_date } = body as {
    title: string;
    notes?: string | null;
    due_date?: string | null;
  };

  const { data, error } = await supabaseServer
    .from("tasks")
    .insert({
      project_id: id,
      title,
      notes: notes ?? null,
      due_date: due_date ?? null,
      status: "todo"
    })
    .select()
    .single();

  if (error) {
    console.error("POST /api/projects/[id]/tasks", error);
    return NextResponse.json(
      { error: "failed_to_create_task", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

// DELETE all done tasks for this project (your "wipe done" button)
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const { error } = await supabaseServer
    .from("tasks")
    .delete()
    .eq("project_id", id)
    .eq("status", "done");

  if (error) {
    console.error("DELETE /api/projects/[id]/tasks", error);
    return NextResponse.json(
      { error: "failed_to_clear_done", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
