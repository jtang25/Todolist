// app/components/TimelineView.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: "todo" | "doing" | "done";
  priority: number;
  due_date?: string | null;
};

function formatDayLabel(date: Date, today: Date) {
  const isToday =
    date.toDateString() === today.toDateString();
  const isTomorrow =
    date.toDateString() ===
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toDateString();

  if (isToday) return "Today · " + date.toLocaleDateString(undefined, { weekday: "long" });
  if (isTomorrow)
    return "Tomorrow · " + date.toLocaleDateString(undefined, { weekday: "long" });

  return (
    date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    }) +
    " · " +
    date.toLocaleDateString(undefined, { weekday: "long" })
  );
}

export default function TimelineView({
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
}) {
  const today = new Date();

  // build range: 7 days before -> 30 days after
  const days = useMemo(() => {
    const arr: Date[] = [];
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }
    return arr;
  }, [today]);

  // group tasks by yyyy-mm-dd
  const taskMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.due_date) {
        if (!map["__no_date__"]) map["__no_date__"] = [];
        map["__no_date__"].push(t);
      } else {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    // sort tasks in each bucket: status then priority
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        if (a.status !== b.status) {
          const order = { todo: 0, doing: 1, done: 2 } as const;
          return order[a.status] - order[b.status];
        }
        return a.priority - b.priority;
      });
    });
    return map;
  }, [tasks]);

  // scroll to today block
  const todayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ block: "start" });
    }
  }, []);

  return (
    <section className="flex-1 overflow-y-auto bg-slate-950/5 px-6 py-5">
      <h2 className="text-lg font-semibold text-slate-50 mb-4">
        Upcoming
      </h2>
      <div className="space-y-6 relative">
        {/* vertical line */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-800/50 pointer-events-none" />

        {days.map((day) => {
          const y = day.getFullYear();
          const m = (day.getMonth() + 1).toString().padStart(2, "0");
          const d = day.getDate().toString().padStart(2, "0");
          const key = `${y}-${m}-${d}`;
          const dayTasks = taskMap[key] ?? [];

          return (
            <div
              key={key}
              ref={
                day.toDateString() === today.toDateString()
                  ? todayRef
                  : undefined
              }
              className="pl-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-slate-950 border border-slate-700/70 flex items-center justify-center text-xs font-semibold text-slate-100">
                  {day.getDate()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {formatDayLabel(day, today)}
                  </p>
                  <p className="text-[0.65rem] text-slate-500">
                    {day.toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {dayTasks.length === 0 ? (
                <div className="ml-11 mb-2 rounded-lg border border-dashed border-slate-800/60 bg-slate-950/10 text-xs text-slate-500 px-3 py-2">
                  No tasks
                </div>
              ) : (
                <div className="ml-11 flex flex-col gap-2 mb-2">
                  {dayTasks.map((t) => {
                    const isSelected = t.id === selectedTaskId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className={`w-full text-left flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition ${
                          isSelected
                            ? "border-indigo-400/80 bg-indigo-500/15"
                            : "border-slate-800/50 bg-slate-950/20 hover:bg-slate-950/40"
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-slate-50">
                            {t.title}
                          </p>
                          {t.notes ? (
                            <p className="text-[0.65rem] text-slate-400 line-clamp-2">
                              {t.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[0.6rem] px-2 py-0.5 rounded-md uppercase tracking-wide ${
                              t.status === "done"
                                ? "bg-emerald-500/15 text-emerald-200"
                                : t.status === "doing"
                                ? "bg-indigo-500/15 text-indigo-200"
                                : "bg-slate-500/10 text-slate-200"
                            }`}
                          >
                            {t.status}
                          </span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              t.priority === 1
                                ? "bg-rose-400"
                                : t.priority === 3
                                ? "bg-slate-400"
                                : "bg-amber-300"
                            }`}
                            title={
                              t.priority === 1
                                ? "High"
                                : t.priority === 3
                                ? "Low"
                                : "Normal"
                            }
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* no-date bucket */}
        {taskMap["__no_date__"] && taskMap["__no_date__"].length > 0 && (
          <div className="pl-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-slate-950 border border-slate-700/70 flex items-center justify-center text-xs font-semibold text-slate-100">
                Ø
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  No due date
                </p>
                <p className="text-[0.65rem] text-slate-500">
                  Tasks without a date
                </p>
              </div>
            </div>
            <div className="ml-11 flex flex-col gap-2 mb-2">
              {taskMap["__no_date__"].map((t) => {
                const isSelected = t.id === selectedTaskId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className={`w-full text-left flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition ${
                      isSelected
                        ? "border-indigo-400/80 bg-indigo-500/15"
                        : "border-slate-800/50 bg-slate-950/20 hover:bg-slate-950/40"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-slate-50">
                        {t.title}
                      </p>
                      {t.notes ? (
                        <p className="text-[0.65rem] text-slate-400 line-clamp-2">
                          {t.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[0.6rem] px-2 py-0.5 rounded-md uppercase tracking-wide ${
                          t.status === "done"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : t.status === "doing"
                            ? "bg-indigo-500/15 text-indigo-200"
                            : "bg-slate-500/10 text-slate-200"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          t.priority === 1
                            ? "bg-rose-400"
                            : t.priority === 3
                            ? "bg-slate-400"
                            : "bg-amber-300"
                        }`}
                        title={
                          t.priority === 1
                            ? "High"
                            : t.priority === 3
                            ? "Low"
                            : "Normal"
                        }
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
