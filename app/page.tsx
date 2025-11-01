// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import ProjectSidebar from "@/components/ProjectSidebar";
import TopBar from "@/components/TopBar";
import TaskBoard from "@/components/TaskBoard";
import TaskDetails from "@/components/TaskDetails";
import ImportModal from "@/components/ImportModal";
import DatePicker from "@/components/DatePicker";
import TimelineView from "@/components/TimelineView";
import StatsPanel from "@/components/StatsPanel";
import PrioritySelect from "@/components/PrioritySelect";
import TaskDetailsModal from "@/components/TaskDetailsModal";

type Project = {
  id: string;
  name: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: "todo" | "doing" | "done";
  priority: number;
  due_date?: string | null;
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(2);
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [loadingTask, setLoadingTask] = useState(false);

  const [showImport, setShowImport] = useState(false);

  // "stats" is now a real mode
  const [viewMode, setViewMode] = useState<"board" | "timeline" | "stats">(
    "board"
  );

  async function refreshProjects(keepCurrent = false) {
  const res = await fetch("/api/projects", { cache: "no-store" });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Failed to load projects:", res.status, txt);
    return;
  }

  let data: Project[] = [];
  try {
    data = await res.json();
  } catch (e) {
    console.error("Projects JSON parse failed:", e);
    data = [];
  }

  setProjects(data);
  setActiveProject((prev) => {
    if (!keepCurrent || !prev) {
      return data[0] ?? null;
    }
    const found = data.find((p) => p.id === prev.id);
    return found ?? (data[0] ?? null);
  });
}


  async function refreshTasks(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}/tasks`);
    const data: Task[] = await res.json();
    setTasks(data);
    setSelectedTaskId(null);
  }

  useEffect(() => {
    (async () => {
      await refreshProjects(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeProject) {
      setTasks([]);
      setSelectedTaskId(null);
      return;
    }
    (async () => {
      await refreshTasks(activeProject.id);
    })();
  }, [activeProject]);

  async function handleCreateProject(name: string) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const proj: Project = await res.json();
    setProjects((prev) => [...prev, proj]);
    setActiveProject(proj);
    setTasks([]);
    setSelectedTaskId(null);
    setViewMode("board");
  }

  async function handleClearDone() {
    if (!activeProject) return;
    // optimistically remove from UI
    setTasks((prev) => prev.filter((t) => t.status !== "done"));
    await fetch(`/api/projects/${activeProject.id}/tasks`, {
      method: "DELETE"
    });
  }

  async function handleUpdateProject(id: string, updates: Partial<Project>) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setActiveProject((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev
    );

    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      console.error("Failed to update project");
      await refreshProjects(true);
    }
  }

  async function handleDeleteProject(id: string) {
  try {
    const encoded = encodeURIComponent(id);
    const res = await fetch(`/api/projects/${encoded}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      let reason: any = null;
      try {
        reason = await res.json();
      } catch {
        reason = await res.text();
      }
      console.error(
        "Delete failed (server returned !ok). Status:",
        res.status,
        reason
      );
      await refreshProjects(true);
      return;
    }

    const verify = await fetch(`/api/projects/${encoded}`, {
      method: "HEAD",
      cache: "no-store",
    });

    if (verify.ok) {
      console.error("Delete verification failed: resource still exists.");
      await refreshProjects(true);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveProject((prev) => (prev?.id === id ? null : prev));
    setTasks((prev) => (activeProject?.id === id ? [] : prev));
    setSelectedTaskId((prev) => (activeProject?.id === id ? null : prev));
    setViewMode("board");
    refreshProjects(true).catch(() => {});
  } catch (err) {
    console.error("Delete threw:", err);
    await refreshProjects(true);
  }
}


  async function handleAddTask() {
    if (!activeProject || !newTaskTitle.trim()) return;
    setLoadingTask(true);
    const res = await fetch(`/api/projects/${activeProject.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        notes: newTaskNotes.trim() || null,
        due_date: newTaskDueDate || null
      })
    });
    const task: Task = await res.json();
    setTasks((prev) => [...prev, task]);
    setSelectedTaskId(task.id);
    setNewTaskTitle("");
    setNewTaskPriority(2);
    setNewTaskNotes("");
    setNewTaskDueDate("");
    setLoadingTask(false);
  }

  async function handleSetStatus(id: string, status: Task["status"]) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  async function handleSaveTaskDetails(updates: Partial<Task>) {
    if (!selectedTask) return;
    await fetch(`/api/tasks/${selectedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id ? { ...t, ...updates } : t
      )
    );
  }

  async function handleDeleteTask() {
    if (!selectedTask) return;
    await fetch(`/api/tasks/${selectedTask.id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    setSelectedTaskId(null);
  }

  return (
    <div className="h-screen w-screen flex bg-mesh bg-slate-950 text-slate-50">
      <ProjectSidebar
        projects={projects}
        activeProjectId={activeProject?.id ?? null}
        onSelectProject={(p) => {
          setActiveProject(p);
          setViewMode("board");
        }}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
        onShowStats={() => setViewMode("stats")}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          projectName={activeProject?.name ?? null}
          totalTasks={tasks.length}
          doneTasks={tasks.filter((t) => t.status === "done").length}
        />

        {/* add bar (still needed for board/timeline, we can dim it for stats) */}
        <div
          className={`border-b border-slate-900/40 bg-slate-950/30 backdrop-blur-sm ${
            viewMode === "stats" ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          <div className="px-6 pt-4 pb-2 flex gap-3 items-center">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={
                activeProject
                  ? "Quick add task to this project..."
                  : "Create or select a project first..."
              }
              className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
              disabled={!activeProject}
            />
            <PrioritySelect
              value={newTaskPriority as 1 | 2 | 3}
              onChange={(v) => setNewTaskPriority(v)}
              disabled={!activeProject}
              size="sm"
            />
            <button
              onClick={handleAddTask}
              disabled={!activeProject || loadingTask}
              className="bg-indigo-500 hover:bg-indigo-400 transition text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-60"
            >
              {loadingTask ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="bg-slate-800 hover:bg-slate-700 text-sm px-3 py-2 rounded-lg"
            >
              Import JSON
            </button>
            <div className="ml-auto flex gap-2 bg-slate-900/30 border border-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("board")}
                className={`px-3 py-1.5 text-xs rounded-md ${
                  viewMode === "board"
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 text-xs rounded-md ${
                  viewMode === "timeline"
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>
          <div className="px-6 pb-4 flex gap-3 items-center">
            <input
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              placeholder="Description / notes (optional)"
              className="flex-1 bg-slate-900/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              disabled={!activeProject}
            />
            <DatePicker
              value={newTaskDueDate}
              onChange={(v) => setNewTaskDueDate(v)}
            />
          </div>
        </div>

        {/* main content */}
        <div className="flex-1 min-h-0 flex">
          {viewMode === "stats" ? (
            <StatsPanel
              activeProjectId={activeProject?.id ?? null}
              projects={projects}
            />
          ) : (
            <>
              {viewMode === "board" ? (
                <TaskBoard
                  tasks={tasks}
                  onSetStatus={handleSetStatus}
                  onSelectTask={(task) => setSelectedTaskId(task.id)}
                  selectedTaskId={selectedTaskId}
                  onClearDone={handleClearDone}
                />
              ) : (
                <TimelineView
                  tasks={tasks}
                  onSelectTask={(task) => setSelectedTaskId(task.id)}
                  selectedTaskId={selectedTaskId}
                />
              )}

              <TaskDetailsModal
                task={selectedTask}
                open={selectedTask != null}
                onClose={() => setSelectedTaskId(null)}
                onSave={handleSaveTaskDetails}
                onDelete={handleDeleteTask}
              />
            </>
          )}
        </div>
      </div>

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        currentProjectId={activeProject?.id ?? null}
        onImported={async () => {
          await refreshProjects(true);
          const currentId = activeProject?.id;
          if (currentId) {
            await refreshTasks(currentId);
          }
        }}
      />
    </div>
  );
}
