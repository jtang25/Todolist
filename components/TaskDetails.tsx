"use client";

import { useEffect, useState } from "react";
import DatePicker from "@/components/DatePicker";
import PrioritySelect from "@/components/PrioritySelect";

type Task = {
  id: string;
  title: string;
  notes?: string;
  priority: number;
  due_date?: string | null;
};

export default function TaskDetails({
  task,
  onSave,
  onDelete
}: {
  task: Task | null;
  onSave: (updates: Partial<Task>) => Promise<void> | void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [dueDate, setDueDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setPriority((task.priority as 1 | 2 | 3) ?? 2);
      setDueDate(task.due_date ?? "");
      setJustSaved(false);
      setSaving(false);
    }
  }, [task]);

  if (!task) {
    return (
      <aside className="w-72 border-l border-slate-800/50 bg-slate-950/40 backdrop-blur-md p-5 text-sm text-slate-400">
        Select a task to edit notes and due date.
      </aside>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        title,
        notes,
        priority,
        due_date: dueDate || null
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1400);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="w-72 border-l border-slate-800/50 bg-slate-950/40 backdrop-blur-md p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-slate-50">
            Task details
          </h3>
          {justSaved ? (
            <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
              Saved
            </span>
          ) : null}
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-rose-300 hover:text-rose-200"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-900/40 border border-slate-700/40 rounded-lg px-2 py-1 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">Description / notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="bg-slate-900/40 border border-slate-700/40 rounded-lg px-2 py-1 text-sm resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">Due date</label>
        <DatePicker value={dueDate} onChange={(v) => setDueDate(v)} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-slate-400">Priority</label>
        <PrioritySelect value={priority} onChange={setPriority} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-2 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-sm py-2 rounded-lg font-medium text-slate-50 transition ${
          saving ? "opacity-70 cursor-wait" : ""
        }`}
      >
        {saving ? (
          <>
            <span className="h-3 w-3 rounded-full border-2 border-slate-100/80 border-t-transparent animate-spin" />
            Saving...
          </>
        ) : justSaved ? (
          <>
            <span className="text-emerald-200">✓</span> Saved
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </aside>
  );
}
