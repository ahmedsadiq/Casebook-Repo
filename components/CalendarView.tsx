"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CalendarEvent = {
  date: string;
  title: string;
  caseId: string;
  overdue?: boolean;
};

interface Props {
  events: CalendarEvent[];
  basePath: string;
  title?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function endOfWeek(d: Date) {
  return addDays(startOfWeek(d), 6);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default function CalendarView({ events, basePath, title = "Calendar" }: Props) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const todayKey = toDateKey(new Date());

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      const key = e.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const total = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return Array.from({ length: total }, (_, i) => addDays(start, i));
  }, [view, cursor]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekLabel = `${startOfWeek(cursor).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${endOfWeek(cursor).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  function shift(step: number) {
    setCursor(prev => {
      const d = new Date(prev);
      if (view === "week") d.setDate(d.getDate() + step * 7);
      else d.setMonth(d.getMonth() + step);
      return d;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{view === "week" ? `Week of ${weekLabel}` : monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={() => shift(-1)}>Prev</button>
          <button className="btn-secondary btn-sm" onClick={() => setCursor(new Date())}>Today</button>
          <button className="btn-secondary btn-sm" onClick={() => shift(1)}>Next</button>
          <div className="ml-2 flex items-center rounded-lg border border-gray-200 bg-white">
            <button
              className={`px-3 py-1.5 text-xs ${view === "month" ? "bg-navy-50 text-navy-700 font-semibold" : "text-gray-500"}`}
              onClick={() => setView("month")}
            >
              Month
            </button>
            <button
              className={`px-3 py-1.5 text-xs ${view === "week" ? "bg-navy-50 text-navy-700 font-semibold" : "text-gray-500"}`}
              onClick={() => setView("week")}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-400 uppercase">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-3 py-2">{d}</div>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${view === "week" ? "" : "auto-rows-[110px]"}`}>
          {days.map(d => {
            const key = toDateKey(d);
            const isToday = key === todayKey;
            const inMonth = d.getMonth() === cursor.getMonth();
            const dayEvents = eventsByDate[key] ?? [];
            const hasOverdue = dayEvents.some(e => e.overdue);
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`text-left border-b border-r border-gray-100 p-2.5 transition-colors ${
                  selectedDate === key ? "bg-navy-50/60" : "bg-white"
                } ${!inMonth && view === "month" ? "text-gray-300" : "text-gray-700"} ${
                  isToday ? "ring-2 ring-navy-200" : hasOverdue ? "ring-2 ring-red-200" : ""
                }`}
              >
                <div className={`text-xs font-semibold ${isToday ? "text-navy-700" : ""}`}>{d.getDate()}</div>
                <div className="mt-1.5 space-y-1">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div
                      key={`${ev.caseId}-${ev.title}`}
                      className={`truncate rounded px-1.5 py-0.5 text-xs ${
                        ev.overdue ? "bg-red-100 text-red-700" : isToday ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[11px] text-gray-400">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-700">Hearings on {selectedDate}</h2>
        </div>
        <div className="card-body text-sm">
          {!selectedEvents.length ? (
            <p className="text-gray-400">No hearings scheduled for this date.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map(ev => (
                <li key={`${ev.caseId}-${ev.title}`} className="flex items-center justify-between">
                  <div>
                    <Link className="font-medium text-navy-700 hover:underline" href={`${basePath}/${ev.caseId}`}>
                      {ev.title}
                    </Link>
                    {ev.overdue && <span className="ml-2 text-xs text-red-600 font-semibold">Overdue</span>}
                  </div>
                  <span className="text-xs text-gray-400">{ev.date.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
