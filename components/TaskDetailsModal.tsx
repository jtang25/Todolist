// app/components/TaskDetailsModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import DatePicker from "@/components/DatePicker";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type Task = {
  id: string;
  title: string;
  notes?: string;
  due_date?: string | null;
};

export default function TaskDetailsModal({
  task,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Preview default
  const [showPreview, setShowPreview] = useState(true);

  // Drag state
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, dragging: false });

  const previewText = notes
    .trim()
    .replace(/^```(?:\w+)?\n?([\s\S]*?)\n?```$/m, "$1");

  // hydrate
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setDueDate(task.due_date ?? "");
      setSaved(false);
      setConfirmDelete(false);
      setShowPreview(true);
    }
  }, [task, open]);

  // initial position + clamp on resize
  useEffect(() => {
    if (!open) return;
    const el = modalRef.current;
    if (!el) return;

    const centerClamp = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const margin = 8;
      const x = Math.max(margin, Math.min((window.innerWidth - w) / 2, window.innerWidth - w - margin));
      const y = Math.max(margin, Math.min(80, window.innerHeight - h - margin));
      setPos({ x, y });
    };
    requestAnimationFrame(centerClamp);

    const onResize = () => {
      if (!modalRef.current) return;
      const w = modalRef.current.offsetWidth;
      const h = modalRef.current.offsetHeight;
      const margin = 8;
      setPos((p) =>
        p
          ? {
              x: Math.max(margin, Math.min(p.x, window.innerWidth - w - margin)),
              y: Math.max(margin, Math.min(p.y, window.innerHeight - h - margin)),
            }
          : p
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // keyboard: Enter = save (unless typing), Esc = close
  useEffect(() => {
    if (!open) return;
    const isTyping = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || t.isContentEditable;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey && !isTyping(e.target)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, title, notes, dueDate]);

  if (!open || !task) return null;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    await onSave({ title, notes, due_date: dueDate || null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1100);
  }

  // drag helpers
  const clamp = (nx: number, ny: number) => {
    const el = modalRef.current;
    if (!el) return { x: nx, y: ny };
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const margin = 8;
    return {
      x: Math.max(margin, Math.min(nx, window.innerWidth - w - margin)),
      y: Math.max(margin, Math.min(ny, window.innerHeight - h - margin)),
    };
  };

  const onDragStart = (clientX: number, clientY: number) => {
    const rect = modalRef.current?.getBoundingClientRect();
    const cur = pos ?? { x: rect?.left ?? 0, y: rect?.top ?? 0 };
    drag.current = { sx: clientX, sy: clientY, ox: cur.x, oy: cur.y, dragging: true };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  };

  const onDragMove = (e: MouseEvent) => {
    if (!drag.current.dragging) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    setPos(clamp(drag.current.ox + dx, drag.current.oy + dy));
  };

  const onDragEnd = () => {
    drag.current.dragging = false;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  };

  // click handler for the invisible drag layer
  const handleDragMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // ignore clicks on interactive elements just in case
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (["button", "input", "textarea", "select", "a"].includes(tag)) return;
    onDragStart(e.clientX, e.clientY);
  };

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1.5px] z-[4000]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[4100]">
        <div
          ref={modalRef}
          style={pos ? { top: pos.y, left: pos.x } : { visibility: "hidden", top: 0, left: 0 }}
          className="absolute w-full max-w-5xl rounded-2xl bg-slate-950 border border-slate-800/70 shadow-2xl flex overflow-hidden"
        >
          {/* Transparent DRAG OVERLAY across the top of LEFT pane (not covering the right rail). */}
          <div
            className="absolute left-0 right-80 top-0 h-12 cursor-move"
            onMouseDown={handleDragMouseDown}
            aria-hidden
          />

          {/* main content; taller (~1.35x) */}
          <div className="flex-1 min-h-[560px] flex">
            {/* left pane */}
            <div className="flex-1 p-6 pt-4 flex flex-col">
              {/* header row (visual only; drag handled by overlay so margins are draggable) */}
              <div className="flex items-center justify-between mb-4 select-none">
                <p className="text-xs text-slate-500">Task</p>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400/80"
                    placeholder="Task title"
                  />
                </div>

                <div className="flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Description / notes</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPreview(false)}
                        className={`text-xs px-2 py-0.5 rounded ${
                          !showPreview ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowPreview(true)}
                        className={`text-xs px-2 py-0.5 rounded ${
                          showPreview ? "bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {!showPreview ? (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-indigo-400/80 h-[320px]"
                      placeholder="Write details…"
                    />
                  ) : notes.trim() ? (
                    <div className="w-full bg-slate-900/30 border border-slate-700/40 rounded-lg px-3 py-2 text-sm h-[320px] overflow-y-auto">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                          {previewText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-900/30 border border-slate-700/40 rounded-lg px-3 py-2 text-sm h-[320px] overflow-y-auto text-slate-100">
                      Nothing to preview.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* right rail */}
            <div className="relative w-80 border-l border-slate-800/50 bg-slate-950/30 p-5 flex flex-col gap-4">
              {/* X button back to top-right of the RIGHT rail */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-200"
                title="Close"
              >
                ✕
              </button>

              <div className="pt-6">
                <p className="text-xs text-slate-400 mb-1">Due date</p>
                <DatePicker value={dueDate} onChange={setDueDate} />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`mt-auto bg-indigo-500 hover:bg-indigo-400 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
                  saving ? "opacity-70 cursor-wait" : ""
                }`}
                title="Enter to save • Esc to close"
              >
                {saving ? "Saving..." : "Save changes"}
                {saved ? <span className="text-emerald-200 text-xs">Saved ✓</span> : null}
              </button>

              {/* Delete as a full-width bar UNDER Save changes with confirm step */}
              <button
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    // auto-reset confirm after a few seconds to avoid sticky state
                    setTimeout(() => setConfirmDelete(false), 4000);
                    return;
                  }
                  await onDelete();
                  onClose();
                }}
                className={`w-full py-2 rounded-lg text-sm font-medium transition border ${
                  confirmDelete
                    ? "bg-rose-600/90 hover:bg-rose-600 text-white border-rose-500"
                    : "bg-slate-900 hover:bg-slate-800 text-rose-300 border-slate-700/60"
                }`}
              >
                {confirmDelete ? "Click again to delete" : "Delete task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
