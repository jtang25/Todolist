// app/api/projects/[id]/route.ts
import { supabaseServer } from "../../../lib/supabaseServer";

// DELETE /api/projects/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // 204 = deleted
  return new Response(null, { status: 204 });
}

// HEAD /api/projects/:id  (your client calls this to verify)
export async function HEAD(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("projects")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!data) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, { status: 200 });
}

// PATCH /api/projects/:id  (because your client calls PATCH in handleUpdateProject)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await req.json();

  const { data, error } = await supabaseServer
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data);
}
