// app/components/TaskBoard.tsx
"use client";

type Task = {
  id: string;
  title: string;
  notes?: string;
  status: "todo" | "doing" | "done";
  due_date?: string | null;
};

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
  // sort by due_date (nulls last) then by title
  const sorted = [...tasks].sort((a, b) => {
    const aHas = !!a.due_date;
    const bHas = !!b.due_date;
    if (aHas && bHas) return a.due_date!.localeCompare(b.due_date!);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return a.title.localeCompare(b.title);
  });

  const todo = sorted.filter((t) => t.status === "todo");
  const doing = sorted.filter((t) => t.status === "doing");
  const done = sorted.filter((t) => t.status === "done");

  return (
    <div className="flex-1 grid grid-cols-3 gap-5 px-6 py-5 overflow-y-auto">
      <Column title="TO DO" count={todo.length}>
        {todo.map((t) => (
          <Card
            key={t.id}
            task={t}
            isSelected={t.id === selectedTaskId}
            onSelect={() => onSelectTask(t)}
            actions={
              <>
                {/* move to doing */}
                <IconButton
                  label="Move to in progress"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "doing");
                  }}
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={1.7}
                    >
                      <path d="M7 5l6 5-6 5V5z" />
                    </svg>
                  }
                />
                {/* mark done */}
                <IconButton
                  variant="green"
                  label="Mark done"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "done");
                  }}
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={1.8}
                    >
                      <path d="M5 10.5l3 3.5 7-8" strokeLinecap="round" />
                    </svg>
                  }
                />
              </>
            }
          />
        ))}
      </Column>

      <Column title="IN PROGRESS" count={doing.length}>
        {doing.map((t) => (
          <Card
            key={t.id}
            task={t}
            isSelected={t.id === selectedTaskId}
            onSelect={() => onSelectTask(t)}
            actions={
              <>
                {/* back to todo */}
                <IconButton
                  label="Move back to todo"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "todo");
                  }}
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={1.7}
                    >
                      <path d="M13 5L7 10l6 5V5z" />
                    </svg>
                  }
                />
                {/* mark done */}
                <IconButton
                  variant="green"
                  label="Mark done"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "done");
                  }}
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={1.8}
                    >
                      <path d="M5 10.5l3 3.5 7-8" strokeLinecap="round" />
                    </svg>
                  }
                />
              </>
            }
          />
        ))}
      </Column>

      <Column
        title="DONE"
        count={done.length}
        extraAction={
          done.length > 0 && onClearDone ? (
            <button
              onClick={onClearDone}
              className="text-[0.6rem] px-2 py-1 rounded bg-slate-900/40 hover:bg-slate-800 text-slate-200"
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
            muted
            actions={
              <>
                {/* undo */}
                <IconButton
                  label="Move back to in progress"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus(t.id, "doing");
                  }}
                  icon={
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth={1.6}
                    >
                      <path
                        d="M8 5H5v3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 8c3-3 9-1.5 9 3.5 0 1-.3 1.7-.8 2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
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
  extraAction,
  children
}: {
  title: string;
  count: number;
  extraAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
          {title}
        </p>
        <div className="flex items-center gap-2">
          {extraAction}
          <span className="text-xs text-slate-400">{count}</span>
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
  muted
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  actions: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border px-3 py-3 flex items-start justify-between gap-3 transition cursor-pointer ${
        muted
          ? "bg-slate-950/10 border-slate-800/20 opacity-60"
          : "bg-slate-950/30 border-slate-800/60 backdrop-blur-sm"
      } ${
        isSelected
          ? "border-indigo-400/70 shadow-md shadow-indigo-500/10"
          : "hover:border-slate-500/50"
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

function IconButton({
  label,
  onClick,
  icon,
  variant
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  variant?: "green";
}) {
  const base =
    "h-7 w-7 rounded-md flex items-center justify-center text-xs transition";
  const styles =
    variant === "green"
      ? "bg-emerald-500/90 hover:bg-emerald-400 text-slate-900"
      : "bg-slate-900/80 hover:bg-slate-700 text-slate-100";
  return (
    <button onClick={onClick} title={label} className={`${base} ${styles}`}>
      {icon}
    </button>
  );
}
