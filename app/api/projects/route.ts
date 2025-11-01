// app/api/projects/route.ts
import { supabaseServer } from "../../lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(error.message, { status: 500 });
  }
  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("projects")
    .insert({
      name: body.name,
      color: body.color ?? "#6366f1",
      owner: body.owner ?? null
    })
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }
  return Response.json(data);
}
