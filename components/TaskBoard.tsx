// app/components/TaskBoard.tsx
"use client";

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: "todo" | "doing" | "done";
  due_date?: string | null;
};

function sortByDueDate(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const aHas = !!a.due_date;
    const bHas = !!b.due_date;
    if (aHas && bHas) {
      // compare yyyy-mm-dd strings
      if (a.due_date! < b.due_date!) return -1;
      if (a.due_date! > b.due_date!) return 1;
      return 0;
    }
    if (aHas && !bHas) return -1; // dated first
    if (!aHas && bHas) return 1;
    return 0;
  });
}

export default function TaskBoard({
  tasks,
  onSetStatus,
  onSelectTask,
  selectedTaskId,
  onClearDone
}: {
  tasks: Task[];
  onSetStatus: (id: string, status: Task["status"]) => void;
  onSelectTask: (task: Task) => void;
  selectedTaskId: string | null;
  onClearDone?: () => void;
}) {
  const todo = sortByDueDate(tasks.filter((t) => t.status === "todo"));
  const doing = sortByDueDate(tasks.filter((t) => t.status === "doing"));
  const done = sortByDueDate(tasks.filter((t) => t.status === "done"));

  return (
    <div className="flex-1 grid grid-cols-3 gap-5 px-6 py-5 overflow-y-auto">
      {/* TODO */}
      <Column title="TO DO" count={todo.length}>
        {todo.map((t) => (
          <Card
            key={t.id}
            task={t}
            isSelected={t.id === selectedTaskId}
            onSelect={() => onSelectTask(t)}
            actions={
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "doing");
                  }}
                  className="h-7 w-7 rounded-md bg-slate-900/80 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-100"
                  title="Move to in progress"
                >
                  ▶
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "done");
                  }}
                  className="h-7 w-7 rounded-md bg-emerald-500/90 hover:bg-emerald-400 flex items-center justify-center text-xs text-slate-900"
                  title="Mark done"
                >
                  ✓
                </button>
              </>
            }
          />
        ))}
      </Column>

      {/* DOING */}
      <Column title="IN PROGRESS" count={doing.length}>
        {doing.map((t) => (
          <Card
            key={t.id}
            task={t}
            isSelected={t.id === selectedTaskId}
            onSelect={() => onSelectTask(t)}
            actions={
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "todo");
                  }}
                  className="h-7 w-7 rounded-md bg-slate-900/80 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-100"
                  title="Move back to todo"
                >
                  ◀
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "done");
                  }}
                  className="h-7 w-7 rounded-md bg-emerald-500/90 hover:bg-emerald-400 flex items-center justify-center text-xs text-slate-900"
                  title="Mark done"
                >
                  ✓
                </button>
              </>
            }
          />
        ))}
      </Column>

      {/* DONE */}
      <Column
        title="DONE"
        count={done.length}
        rightSlot={
          onClearDone ? (
            <button
              onClick={onClearDone}
              className="text-[0.6rem] text-slate-400 hover:text-rose-200 hover:bg-slate-900/40 px-2 py-1 rounded-md"
            >
              Clear
            </button>
          ) : null
        }
      >
        {done.map((t) => (
          <Card
            key={t.id}
            task={t}
            isSelected={t.id === selectedTaskId}
            onSelect={() => onSelectTask(t)}
            dimmed
            actions={
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "doing");
                  }}
                  className="h-7 w-7 rounded-md bg-slate-900/80 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-100"
                  title="Move back to in progress"
                >
                  ↺
                </button>
              </>
            }
          />
        ))}
      </Column>
    </div>
  );
}

function Column({
  title,
  count,
  children,
  rightSlot
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
          {title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{count}</span>
          {rightSlot}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-3 min-h-[40px]">{children}</div>
    </div>
  );
}

function Card({
  task,
  isSelected,
  onSelect,
  actions,
  dimmed = false
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  actions: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border px-3 py-3 bg-slate-950/30 backdrop-blur-sm flex items-start justify-between gap-3 transition cursor-pointer ${
        isSelected
          ? "border-indigo-400/70 shadow-md shadow-indigo-500/10"
          : dimmed
          ? "border-slate-800/20 opacity-50 hover:opacity-80"
          : "border-slate-800/60 hover:border-slate-500/50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-50 truncate">
          {task.title}
        </p>
        <p className="text-[0.65rem] text-slate-400 mt-1 truncate">
          {task.due_date ? `Due ${task.due_date}` : "No due date"}
        </p>
        {task.notes ? (
          <p className="text-[0.6rem] text-slate-500 mt-1 line-clamp-2">
            {task.notes}
          </p>
        ) : null}
      </div>
      <div className="flex gap-1 shrink-0">{actions}</div>
    </div>
  );
}
