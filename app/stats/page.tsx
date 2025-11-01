// app/stats/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  due_date?: string | null;
  // backend probably has more fields, we only care about done + date
};

type DayBucket = {
  date: string; // yyyy-mm-dd
  count: number;
};

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayBucket[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const projRes = await fetch("/api/projects");
      const projects: Project[] = await projRes.json();

      // fetch tasks for each project
      const allTasks: Task[] = [];
      await Promise.all(
        projects.map(async (p) => {
          const r = await fetch(`/api/projects/${p.id}/tasks`);
          const ts: Task[] = await r.json();
          allTasks.push(...ts);
        })
      );

      // group done tasks by day
      const map: Record<string, number> = {};
      const today = ymd(new Date());

      allTasks.forEach((t) => {
        if (t.status !== "done") return;
        // prefer due_date as the "finished" day since we don't have completed_at
        const key = t.due_date && t.due_date.length >= 10 ? t.due_date.slice(0, 10) : today;
        map[key] = (map[key] ?? 0) + 1;
      });

      // make sure we at least show last 14 days
      const buckets: DayBucket[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = ymd(d);
        buckets.push({
          date: k,
          count: map[k] ?? 0
        });
      }

      setDays(buckets);
      setLoading(false);
    })();
  }, []);

  // build noisy series
  const series = useMemo(() => {
    // for each day we create 6 subpoints with tiny random jitter
    const pts: { x: number; y: number; date: string }[] = [];
    const dayWidth = 100; // virtual units
    days.forEach((day, idx) => {
      const base = day.count;
      for (let j = 0; j < 6; j++) {
        const x = idx * dayWidth + (j / 5) * dayWidth;
        // jitter but keep around base
        const noise = (Math.sin((idx + j) * 1.3) * 0.12) + (Math.random() * 0.08 - 0.04);
        const y = Math.max(0, base + noise);
        pts.push({ x, y, date: day.date });
      }
    });
    return pts;
  }, [days]);

  // convert to svg coords
  const width = 1100;
  const height = 280;
  const paddingLeft = 40;
  const paddingRight = 12;
  const paddingTop = 24;
  const paddingBottom = 32;

  const maxX = series.length ? series[series.length - 1].x : 1;
  const maxY = Math.max(1, ...series.map((p) => p.y), ...days.map((d) => d.count));

  const pointsAttr = series
    .map((p) => {
      const sx =
        paddingLeft +
        (p.x / Math.max(1, maxX)) *
          (width - paddingLeft - paddingRight);
      const sy =
        height -
        paddingBottom -
        (p.y / Math.max(1, maxY)) * (height - paddingTop - paddingBottom);
      return `${sx},${sy}`;
    })
    .join(" ");

  // area path
  const areaPath = (() => {
    if (!series.length) return "";
    const first = series[0];
    const firstX =
      paddingLeft +
      (first.x / Math.max(1, maxX)) *
        (width - paddingLeft - paddingRight);
    const baseY = height - paddingBottom;
    let d = `M ${firstX} ${baseY} `;
    series.forEach((p) => {
      const sx =
        paddingLeft +
        (p.x / Math.max(1, maxX)) *
          (width - paddingLeft - paddingRight);
      const sy =
        height -
        paddingBottom -
        (p.y / Math.max(1, maxY)) * (height - paddingTop - paddingBottom);
      d += `L ${sx} ${sy} `;
    });
    const last = series[series.length - 1];
    const lastX =
      paddingLeft +
      (last.x / Math.max(1, maxX)) *
        (width - paddingLeft - paddingRight);
    d += `L ${lastX} ${baseY} Z`;
    return d;
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="h-14 border-b border-slate-900/60 flex items-center justify-between px-6">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">Completion stats</h1>
          <p className="text-[0.65rem] text-slate-400">
            Last 14 days · aggregated from all projects
          </p>
        </div>
        <Link
          href="/"
          className="text-xs bg-slate-100 text-slate-900 rounded-lg px-3 py-1.5 hover:bg-white transition"
        >
          ← Back to board
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-b from-slate-950/40 to-slate-900/10 border border-slate-800/70 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                Task completion
              </p>
              <p className="text-2xl font-semibold text-slate-50">
                {days.reduce((acc, d) => acc + d.count, 0)} done
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Fake volatility</p>
              <p className="text-sm text-emerald-300">
                +{(Math.random() * 3.2 + 0.3).toFixed(2)}% today
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="relative">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-[280px]"
                role="img"
              >
                {/* y-axis line */}
                <line
                  x1={40}
                  y1={20}
                  x2={40}
                  y2={height - 32}
                  stroke="rgba(148, 163, 184, 0.25)"
                  strokeWidth={1}
                />
                {/* x-axis line */}
                <line
                  x1={40}
                  y1={height - 32}
                  x2={width - 12}
                  y2={height - 32}
                  stroke="rgba(148, 163, 184, 0.25)"
                  strokeWidth={1}
                />

                {/* area under curve */}
                <path
                  d={areaPath}
                  fill="rgba(129, 230, 217, 0.12)"
                />

                {/* line */}
                <polyline
                  points={pointsAttr}
                  fill="none"
                  stroke="rgba(125, 211, 252, 0.9)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* dots for latest day */}
                {series.slice(-6).map((p, idx) => {
                  const sx =
                    40 +
                    (p.x / Math.max(1, maxX)) *
                      (width - 40 - 12);
                  const sy =
                    height -
                    32 -
                    (p.y / Math.max(1, maxY)) *
                      (height - 24 - 32);
                  return (
                    <circle
                      key={idx}
                      cx={sx}
                      cy={sy}
                      r={2.6}
                      fill="rgba(125, 211, 252, 1)"
                      stroke="rgba(15, 23, 42, 1)"
                      strokeWidth={1}
                    />
                  );
                })}
              </svg>

              {/* date labels */}
              <div className="flex justify-between mt-3 text-[0.6rem] text-slate-500">
                {days.map((d, i) => (
                  <span key={d.date} className={i % 2 === 0 ? "" : "opacity-40"}>
                    {d.date.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-[0.6rem] text-slate-500">
            Note: when a task is marked <span className="text-slate-200">done</span> but has no date, it’s counted for today. Chart noise is synthetic so flat days don’t look dead.
          </p>
        </div>
      </main>
    </div>
  );
}
