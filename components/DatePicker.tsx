// components/DatePicker.tsx
"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromYmd(v: string | null): Date {
  if (!v) return new Date();
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "yyyy-mm-dd",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const selectedDate = useMemo(() => fromYmd(value || null), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    fromYmd(value || null)
  );

  // portal ready
  useEffect(() => {
    setMounted(true);
  }, []);

  // close on esc / outside
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!btnRef.current) return;
      const target = e.target as HTMLElement;
      // if click is NOT on the button or inside the popup, close
      if (
        target.closest("[data-datepicker-popup]") ||
        target === btnRef.current ||
        target.closest("[data-datepicker-trigger]")
      ) {
        return;
      }
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // position relative to viewport (works even in scrollable containers)
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const width = 264;
    const gap = 8;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let left = rect.left + scrollX;
    const maxLeft = scrollX + window.innerWidth - width - 12;
    if (left > maxLeft) left = maxLeft;
    if (left < scrollX + 8) left = scrollX + 8;

    const top = rect.bottom + gap + scrollY;

    setPopupPos({ top, left });
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<Date | null> = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  function prevMonth() {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleSelect(d: Date) {
    onChange(toYmd(d));
    setOpen(false);
  }

  const popup = open ? (
    <div
      data-datepicker-popup
      className="absolute z-[9999]"
      style={{
        top: popupPos.top,
        left: popupPos.left,
      }}
    >
      <div className="w-64 rounded-xl bg-slate-950 border border-slate-700/60 shadow-2xl p-3 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-50">
            {viewMonth.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 text-slate-100 text-sm"
            >
              ←
            </button>
            <button
              onClick={nextMonth}
              className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 text-slate-100 text-sm"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-[0.65rem] text-slate-400 text-center uppercase"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, idx) => {
            if (!d) return <div key={idx} className="h-7" />;
            const isSelected = value && toYmd(d) === toYmd(selectedDate);
            return (
              <button
                key={idx}
                onClick={() => handleSelect(d)}
                className={`h-7 text-xs rounded-md flex items-center justify-center transition ${
                  isSelected
                    ? "bg-indigo-500 text-white"
                    : "text-slate-100 hover:bg-slate-800"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Clear
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onChange(toYmd(today));
              setViewMonth(today);
              setOpen(false);
            }}
            className="text-xs text-indigo-300 hover:text-indigo-100"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        data-datepicker-trigger
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="bg-slate-900/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-left w-40 flex items-center justify-between hover:border-slate-500/50"
      >
        <span className={value ? "text-slate-50" : "text-slate-500"}>
          {value || placeholder}
        </span>
        <span aria-hidden className="text-slate-400 text-sm">
          📅
        </span>
      </button>

      {mounted ? createPortal(popup, document.body) : null}
    </>
  );
}
