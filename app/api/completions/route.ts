// app/api/completions/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";

function uuidFallback() {
  // in case crypto.randomUUID isn't available in this runtime
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function GET() {
  // 1) try to read anything
  const { data: anyRow, error: anyErr } = await supabaseServer
    .from("task_completions")
    .select("id")
    .limit(1);

  if (anyErr) {
    return new NextResponse(anyErr.message, { status: 500 });
  }

  // 2) if empty, seed 14 days of light data
  if (!anyRow || anyRow.length === 0) {
    const today = new Date();
    const fakeProjectId = "00000000-0000-0000-0000-000000000000";
    const seedRows: {
      id?: string;
      project_id: string;
      task_id: string;
      completed_at: string;
    }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);

      // 0–2 completions per day; small so chart isn’t crazy
      const num = Math.floor(Math.random() * 3);
      for (let j = 0; j < num; j++) {
        seedRows.push({
          project_id: fakeProjectId,
          task_id: uuidFallback(),
          completed_at: iso
        });
      }
    }

    if (seedRows.length > 0) {
      const { error: seedErr } = await supabaseServer
        .from("task_completions")
        .insert(seedRows);
      if (seedErr) {
        return new NextResponse(seedErr.message, { status: 500 });
      }
    }
  }

  // 3) read everything and aggregate (date, project_id) -> count
  const { data: rows, error } = await supabaseServer
    .from("task_completions")
    .select("project_id, completed_at")
    .order("completed_at", { ascending: true });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  const agg: Record<string, number> = {};
  (rows ?? []).forEach((r) => {
    const date = r.completed_at.slice(0, 10);
    const key = `${date}|${r.project_id}`;
    agg[key] = (agg[key] ?? 0) + 1;
  });

  const out: { date: string; project_id: string; count: number }[] = [];
  for (const [key, count] of Object.entries(agg)) {
    const [date, project_id] = key.split("|");
    out.push({ date, project_id, count });
  }

  return NextResponse.json(out);
}
