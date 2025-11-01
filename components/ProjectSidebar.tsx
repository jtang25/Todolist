"use client";

type Project = {
  id: string;
  name: string;
  color: string;
};

export default function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onUpdateProject,
  onShowStats
}: {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (p: Project) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onShowStats: () => void;
}) {
  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-900/60 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-semibold tracking-tight text-slate-50">
          Projects
        </p>
        <button
          onClick={() => {
            const name = prompt("Project name?");
            if (name && name.trim()) onCreateProject(name.trim());
          }}
          className="bg-slate-100 text-slate-950 rounded-lg px-3 py-1 text-xs font-medium hover:bg-white"
        >
          + New
        </button>
      </div>

      <div className="px-3 flex-1 overflow-y-auto space-y-2">
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectProject(p)}
            className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer ${
              activeProjectId === p.id
                ? "bg-slate-900/80"
                : "hover:bg-slate-900/30"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.color ?? "#4f46e5" }}
            />
            <span className="flex-1 text-left truncate">{p.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const ok = confirm("Delete this project?");
                if (ok) onDeleteProject(p.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition"
            >
              🗑
            </button>
          </div>
        ))}

        {/* STATS ENTRY */}
        <div className="pt-4 mt-2 border-t border-slate-900/60">
          <button
            type="button"
            onClick={onShowStats}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/30 hover:bg-slate-900/60 text-sm"
          >
            <span className="h-6 w-6 rounded-full bg-emerald-400/20 text-emerald-200 flex items-center justify-center text-xs">
              $
            </span>
            <span className="flex-1 text-left">Completion stats</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-[0.6rem] text-slate-500">v0.1</div>
    </aside>
  );
}
