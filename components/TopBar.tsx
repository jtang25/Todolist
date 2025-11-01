// components/TopBar.tsx
export default function TopBar({
  projectName,
  totalTasks,
  doneTasks
}: {
  projectName: string | null;
  totalTasks: number;
  doneTasks: number;
}) {
  return (
    <header className="h-14 border-b border-slate-800/60 px-6 flex items-center justify-between bg-slate-950/20 backdrop-blur-sm">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">
          Current project
        </p>
        <h2 className="text-base font-semibold leading-tight">
          {projectName ?? "—"}
        </h2>
      </div>
      <div className="flex gap-3 text-xs text-slate-400 items-center">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/90 inline-block" />
          <span>{totalTasks} tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 inline-block" />
          <span>{doneTasks} done</span>
        </div>
      </div>
    </header>
  );
}
