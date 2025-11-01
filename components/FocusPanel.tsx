// app/components/FocusPanel.tsx
"use client";

import { useMemo } from "react";

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: "todo" | "doing" | "done";
  priority: number;
  due_date?: string | null;
};

export default function FocusPanel({
  tasks,
  dailyGoal,
  onChangeGoal,
  onCompleteTask
}: {
  tasks: Task[];
  dailyGoal: number;
  onChangeGoal: (n: number) => void;
  onCompleteTask: (id: string) => void;
}) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10); // yyyy-mm-dd

  const { doneToday, dueToday, overdue } = useMemo(() => {
    const dueToday: Task[] = [];
    const overdue: Task[] = [];
    let doneToday = 0;

    tasks.forEach((t) => {
      // "done today" = status done AND (due is today OR no due)
      if (t.status === "done") {
        doneToday += 1;
      }
      if (t.due_date) {
        if (t.due_date === todayKey) {
          dueToday.push(t);
        } else if (t.due_date < todayKey && t.status !== "done") {
          overdue.push(t);
        }
      }
    });

    // sort a bit: high priority first
    dueToday.sort((a, b) => a.priority - b.priority);
    overdue.sort((a, b) => a.priority - b.priority);

    return { doneToday, dueToday, overdue };
  }, [tasks, todayKey]);

  const pct = Math.min(100, Math.floor((doneToday / dailyGoal) * 100));

  return (
    <div className="px-6 pt-4 pb-1">
      <div className="rounded-2xl bg-slate-950/40 border border-slate-800/50 px-4 py-3 flex items-start gap-4">
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1">
            {today.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric"
            })}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Today focus
            </h2>
            <span className="text-[0.65rem] text-slate-400">
              {doneToday} / {dailyGoal} done
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-900/60 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                pct >= 100 ? "bg-emerald-400" : "bg-indigo-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[0.65rem] text-slate-500">
            {pct >= 100
              ? "Nice — you hit your goal today."
              : pct >= 50
              ? "You’re over halfway. One or two more."
              : "Pick 1-2 tasks from below and clear them."}
          </p>
        </div>
        <div className="w-32">
          <label className="text-[0.6rem] text-slate-400 block mb-1">
            Daily goal
          </label>
          <input
            type="number"
            min={1}
            value={dailyGoal}
            onChange={(e) => onChangeGoal(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-900/50 border border-slate-700/40 rounded-lg px-2 py-1 text-xs outline-none"
          />
        </div>
      </div>

      {/* actions */}
      <div className="mt-3 flex gap-4">
        <div className="flex-1">
          <p className="text-[0.65rem] text-slate-400 mb-1 uppercase tracking-wide">
            Due today
          </p>
          {dueToday.length === 0 ? (
            <div className="text-[0.65rem] text-slate-500 pb-2">
              Nothing due today.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dueToday.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onCompleteTask(t.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/50 text-xs text-left hover:bg-slate-800 flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="truncate max-w-[150px]">{t.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-48">
          <p className="text-[0.65rem] text-slate-400 mb-1 uppercase tracking-wide">
            Overdue
          </p>
          {overdue.length === 0 ? (
            <div className="text-[0.65rem] text-slate-500 pb-2">
              All caught up.
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-20 overflow-y-auto pr-1">
              {overdue.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onCompleteTask(t.id)}
                  className="text-xs text-left bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/50 rounded-md px-2 py-1 flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
