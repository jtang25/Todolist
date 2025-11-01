"use client";

import { useEffect, useRef, useState } from "react";

const OPTIONS = [
  { label: "High", value: 1 as const, dot: "bg-rose-400" },
  { label: "Normal", value: 2 as const, dot: "bg-sky-300" },
  { label: "Low", value: 3 as const, dot: "bg-slate-400" }
];

export default function PrioritySelect({
  value,
  onChange,
  disabled = false,
  size = "md"
}: {
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);

  // keep ref in sync (so listeners can read latest)
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const current =
    OPTIONS.find((o) => o.value === value) ?? OPTIONS.find((o) => o.value === 2)!;

  const buttonClasses =
    size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";

  // helper: calc & set position
  const updatePosition = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 180;
    const gap = 6;

    let left = rect.left + window.scrollX;
    const maxLeft = window.innerWidth + window.scrollX - width - 12;
    if (left > maxLeft) left = maxLeft;

    const top = rect.bottom + gap + window.scrollY;
    setPos({ top, left });
  };

  // when we open, compute once
  useEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open]);

  // global listeners — deps never change
  useEffect(() => {
    function handleScrollOrResize() {
      if (openRef.current) {
        updatePosition();
      }
    }

    function handleClick(e: MouseEvent) {
      if (!openRef.current) return;

      const target = e.target as Node;
      const btn = btnRef.current;
      const pop = popupRef.current;

      if (btn && (btn === target || btn.contains(target))) return;
      if (pop && pop.contains(target)) return;

      setOpen(false);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && openRef.current) {
        setOpen(false);
      }
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={`flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-700/40 rounded-lg ${buttonClasses} min-w-[110px] text-slate-50 hover:border-slate-500/60 transition disabled:opacity-50`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${current.dot}`}
            aria-hidden
          />
          <span>{current.label}</span>
        </span>
        <span className="text-slate-400 text-xs">▾</span>
      </button>

      {open && pos ? (
        <div
          ref={popupRef}
          className="absolute z-[6000]"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="w-44 rounded-xl bg-slate-950 border border-slate-700/70 shadow-xl overflow-hidden">
            {OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition
                    ${
                      active
                        ? "bg-indigo-500/10 text-slate-50"
                        : "text-slate-200 hover:bg-slate-800/70"
                    }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${opt.dot}`}
                    aria-hidden
                  />
                  <span className="flex-1">{opt.label}</span>
                  {active ? (
                    <span className="text-xs text-indigo-200">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
