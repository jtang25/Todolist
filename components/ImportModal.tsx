"use client";

import { useState } from "react";

export default function ImportModal({
  open,
  onClose,
  currentProjectId,
  onImported
}: {
  open: boolean;
  onClose: () => void;
  currentProjectId: string | null;
  onImported: () => void; // tell page to refetch
}) {
  const [mode, setMode] = useState<"projects" | "tasks" | "bundle">("tasks");
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    setErrorMsg(null);
    let payload: any;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setErrorMsg("JSON is invalid.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "tasks"
          ? {
              mode: "tasks",
              project_id: currentProjectId,
              tasks: payload
            }
          : mode === "projects"
          ? {
              mode: "projects",
              projects: payload
            }
          : {
              mode: "bundle",
              ...payload
            }
      )
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Import failed");
      return;
    }
    onImported();
    onClose();
    setJsonText("");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setJsonText(String(evt.target?.result || ""));
    };
    reader.readAsText(file);
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[3000]">
      <div className="w-[460px] bg-slate-950 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-50">
            Import from JSON
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm"
          >
            ✕
          </button>
        </div>

        <label className="text-xs text-slate-400 mb-2 block">
          Import mode
        </label>
        <select
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as "projects" | "tasks" | "bundle")
          }
          className="w-full mb-3 bg-slate-900/50 border border-slate-700/40 rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="tasks">
            Tasks → current project ({currentProjectId ? "OK" : "none selected"})
          </option>
          <option value="projects">Projects</option>
          <option value="bundle">Bundle (projects + tasks)</option>
        </select>

        <label className="text-xs text-slate-400 mb-1 block">
          Upload JSON file
        </label>
        <input
          type="file"
          accept="application/json"
          onChange={handleFile}
          className="mb-3 text-xs text-slate-300"
        />

        <label className="text-xs text-slate-400 mb-1 block">
          Or paste JSON
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={8}
          className="w-full bg-slate-900/40 border border-slate-700/40 rounded-lg px-2 py-1.5 text-sm text-slate-100 mb-3 resize-none"
          placeholder={
            mode === "tasks"
              ? `[\n  { "title": "Task A", "notes": "optional", "due_date": "2025-11-01" }\n]`
              : mode === "projects"
              ? `[\n  { "name": "Project A", "color": "#6366f1" }\n]`
              : `{\n  "projects": [ { "name": "Proj 1" } ],\n  "tasks": [ { "title": "Task for Proj 1", "project_name": "Proj 1" } ]\n}`
          }
        />

        {errorMsg ? (
          <p className="text-xs text-rose-300 mb-2">{errorMsg}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg bg-indigo-500 text-slate-50 disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
