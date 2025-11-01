// app/components/StatsPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
};

type Completion = {
  date: string; // yyyy-mm-dd
  project_id: string;
  count: number;
};

export default function StatsPanel({
  activeProjectId,
  projects
}: {
  activeProjectId: string | null;
  projects: Project[];
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Completion[]>([]);

  // load from API (already made in /api/completions)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/completions");
      const json = await res.json();
      setData(json);
      setLoading(false);
    })();
  }, []);

  // build 14-day window, 0 if missing
  const days = useMemo(() => {
    const byDate: Record<string, number> = {};
    data.forEach((r) => {
      byDate[r.date] = (byDate[r.date] ?? 0) + r.count;
    });

    const out: { date: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ date: iso, total: byDate[iso] ?? 0 });
    }
    return out;
  }, [data]);

  const totalDone = days.reduce((a, b) => a + b.total, 0);
  const today = days[days.length - 1]?.total ?? 0;
  const yesterday = days[days.length - 2]?.total ?? 0;
  const change = today - yesterday;

  // per-project rollup
  const perProject = useMemo(() => {
    const mp: Record<string, number> = {};
    data.forEach((r) => {
      mp[r.project_id] = (mp[r.project_id] ?? 0) + r.count;
    });
    return projects
      .map((p) => ({
        id: p.id,
        name: p.name,
        count: mp[p.id] ?? 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, projects]);

  // chart dimensions
  const width = 920;
  const height = 240;
  const padX = 46;
  const padR = 14;
  const padTop = 28;
  const padBottom = 38;

  // stock-style vertical scale → use min..max of data, add padding
  const rawVals = days.map((d) => d.total);
  let minY = Math.min(...rawVals);
  let maxY = Math.max(...rawVals);
  if (minY === maxY) {
    // flat data — give it breathing room
    minY = Math.max(0, minY - 1);
    maxY = maxY + 2;
  } else {
    minY = Math.max(0, minY - 0.5);
    maxY = maxY + 0.5;
  }
  const yRange = maxY - minY;

  const series = days.map((d, idx) => {
    const x =
      padX +
      (idx / Math.max(1, days.length - 1)) * (width - padX - padR);
    const y =
      height -
      padBottom -
      ((d.total - minY) / yRange) * (height - padTop - padBottom);
    return { x, y, date: d.date, value: d.total };
  });

  // line path
  const linePath = series
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const first = series[0];
  const last = series[series.length - 1];
  const baseline = height - padBottom;

  return (
    <div className="flex-1 flex flex-col bg-slate-950/20">
      {/* header */}
      <div className="px-6 py-4 border-b border-slate-900/40 flex items-center justify-between">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-slate-400">
            Task completion
          </p>
          <p className="text-3xl font-semibold text-slate-50 leading-tight">
            {totalDone} done
          </p>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] text-slate-400">today</p>
          <p
            className={`text-sm font-medium ${
              change >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {today} ({change >= 0 ? "+" : ""}
            {change})
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1.1fr_0.5fr] gap-6 p-6 overflow-hidden">
        {/* CHART */}
        <div className="rounded-2xl bg-slate-950/50 border border-slate-900/50 px-4 pt-3 pb-5 shadow-[0_16px_40px_rgba(15,23,42,0.35)]">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-[240px]"
            >
              {/* defs for gradient */}
              <defs>
                <linearGradient
                  id="lineFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(125,211,252,0.25)" />
                  <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                </linearGradient>
              </defs>

              {/* horizontal gridlines */}
              {[0, 1, 2, 3].map((i) => {
                const y =
                  padTop +
                  (i / 3) * (height - padTop - padBottom);
                const val = maxY - (i / 3) * yRange;
                return (
                  <g key={i}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={width - padR}
                      y2={y}
                      stroke="rgba(148,163,184,0.08)"
                      strokeWidth={1}
                    />
                    <text
                      x={12}
                      y={y + 3}
                      fill="rgba(148,163,184,0.35)"
                      fontSize={9}
                    >
                      {val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* area – follow line, then down to baseline, back to start */}
              {series.length > 0 && (
                <path
                  d={`${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`}
                  fill="url(#lineFill)"
                />
              )}

              {/* line */}
              <path
                d={linePath}
                fill="none"
                stroke="rgba(125,211,252,1)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* last point highlight */}
              {last && (
                (() => {
                  const tagWidth = 50;
                  const tagHeight = 22;
                  const tooRight = last.x + tagWidth + 12 > width; // near right edge
                  const rectX = tooRight ? last.x - tagWidth - 12 : last.x + 8;
                  const textX = rectX + tagWidth / 2;

                  return (
                    <>
                      <circle
                        cx={last.x}
                        cy={last.y}
                        r={4.5}
                        fill="rgba(15,23,42,1)"
                        stroke="rgba(125,211,252,1)"
                        strokeWidth={1.6}
                      />
                      <rect
                        x={rectX}
                        y={last.y - 13}
                        rx={6}
                        ry={6}
                        width={tagWidth}
                        height={tagHeight}
                        fill="rgba(15,23,42,0.9)"
                        stroke="rgba(148,163,184,0.25)"
                      />
                      <text
                        x={textX}
                        y={last.y + 2}
                        textAnchor="middle"
                        fill="white"
                        fontSize={9.5}
                      >
                        {last.value}
                      </text>
                    </>
                  );
                })()
              )}

              {/* x labels */}
              {series.map((pt, i) =>
                i % 2 === 0 ? (
                  <text
                    key={pt.date}
                    x={pt.x}
                    y={height - 12}
                    textAnchor="middle"
                    fill="rgba(148,163,184,0.28)"
                    fontSize={9}
                  >
                    {pt.date.slice(5)}
                  </text>
                ) : null
              )}
            </svg>
          )}

          <p className="mt-3 text-[0.6rem] text-slate-500">
            Exact daily completions from Supabase. Scaled like a price chart,
            no synthetic noise.
          </p>
        </div>

        {/* RIGHT PANEL: per project */}
        <div className="rounded-2xl bg-slate-950/50 border border-slate-900/50 p-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-400 mb-1">
            By project
          </p>
          <div className="space-y-2 overflow-y-auto max-h-[190px] pr-2">
            {perProject.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  p.id === activeProjectId
                    ? "bg-slate-900 text-slate-50"
                    : "bg-slate-900/20 text-slate-100/80"
                }`}
              >
                <span className="text-sm truncate">{p.name}</span>
                <span className="text-sm text-emerald-300">
                  {p.count}
                </span>
              </div>
            ))}
            {perProject.length === 0 && (
              <p className="text-xs text-slate-500">
                No completions yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
