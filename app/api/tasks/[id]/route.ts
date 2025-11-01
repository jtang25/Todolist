// app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

// PATCH /api/tasks/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const taskId = params.id;

  // 1) update the task itself
  const { data: updated, error } = await supabaseServer
    .from("tasks")
    .update(body)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  // 2) if it was just marked done, log it to task_completions
  if (body.status === "done") {
    // we need the project_id to attribute this completion
    const { data: taskRow, error: taskErr } = await supabaseServer
      .from("tasks")
      .select("id, project_id")
      .eq("id", taskId)
      .single();

    if (!taskErr && taskRow) {
      await supabaseServer.from("task_completions").insert({
        project_id: taskRow.project_id,
        task_id: taskRow.id,
        // store only the day
        completed_at: new Date().toISOString().slice(0, 10)
      });
    }
  }

  return NextResponse.json(updated);
}

// DELETE /api/tasks/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseServer
    .from("tasks")
    .delete()
    .eq("id", params.id);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

// (optional) GET /api/tasks/:id  — nice to have
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseServer
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return new NextResponse(error.message, { status: 404 });
  }

  return NextResponse.json(data);
}
