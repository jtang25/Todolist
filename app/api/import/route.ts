// app/api/import/route.ts
import { supabaseServer } from "../../lib/supabaseServer";

type IncomingProject = {
  name: string;
  color?: string;
};

type IncomingTask = {
  title: string;
  notes?: string;
  priority?: number;
  status?: "todo" | "doing" | "done";
  due_date?: string | null;
  project_id?: string;     // optional
  project_name?: string;   // or this
};

export async function POST(req: Request) {
  const body = await req.json();

  // body = { mode: "projects" | "tasks" | "bundle", projects?: [], tasks?: [], project_id?: "" }

  // 1) import only projects
  if (body.mode === "projects") {
    const incoming: IncomingProject[] = body.projects ?? [];
    if (!incoming.length) {
      return Response.json({ error: "No projects provided" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("projects")
      .insert(
        incoming.map((p) => ({
          name: p.name,
          color: p.color ?? "#6366f1"
        }))
      )
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ inserted: data });
  }

  // 2) import tasks for one known project_id
  if (body.mode === "tasks") {
    const projectId = body.project_id as string | undefined;
    const tasks: IncomingTask[] = body.tasks ?? [];
    if (!projectId) {
      return Response.json({ error: "project_id required for tasks import" }, { status: 400 });
    }
    if (!tasks.length) {
      return Response.json({ error: "No tasks provided" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("tasks")
      .insert(
        tasks.map((t) => ({
          project_id: projectId,
          title: t.title,
          notes: t.notes ?? "",
          priority: t.priority ?? 2,
          status: t.status ?? "todo",
          due_date: t.due_date ?? null
        }))
      )
      .select();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ inserted: data });
  }

  // 3) bundle – can contain projects + tasks referencing project_name
  if (body.mode === "bundle") {
    const incomingProjects: IncomingProject[] = body.projects ?? [];
    const incomingTasks: IncomingTask[] = body.tasks ?? [];

    // create projects first
    let projectNameToId: Record<string, string> = {};
    if (incomingProjects.length) {
      const { data: created, error } = await supabaseServer
        .from("projects")
        .insert(
          incomingProjects.map((p) => ({
            name: p.name,
            color: p.color ?? "#6366f1"
          }))
        )
        .select();

      if (error) return Response.json({ error: error.message }, { status: 500 });

      created.forEach((p) => {
        projectNameToId[p.name] = p.id;
      });
    }

    // create tasks
    if (incomingTasks.length) {
      const payload = incomingTasks.map((t) => {
        const pid =
          t.project_id ??
          (t.project_name ? projectNameToId[t.project_name] : null);
        return {
          project_id: pid,
          title: t.title,
          notes: t.notes ?? "",
          priority: t.priority ?? 2,
          status: t.status ?? "todo",
          due_date: t.due_date ?? null
        };
      });

      const { data: createdTasks, error: taskErr } = await supabaseServer
        .from("tasks")
        .insert(payload)
        .select();

      if (taskErr)
        return Response.json({ error: taskErr.message }, { status: 500 });

      return Response.json({
        insertedProjects: Object.keys(projectNameToId).length,
        insertedTasks: createdTasks.length
      });
    }

    return Response.json({
      insertedProjects: Object.keys(projectNameToId).length,
      insertedTasks: 0
    });
  }

  return Response.json({ error: "Unsupported mode" }, { status: 400 });
}
