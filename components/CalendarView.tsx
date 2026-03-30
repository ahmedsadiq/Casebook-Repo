"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind?: "hearing" | "task";
  href?: string;
  actionLabel?: string;
  overdue?: boolean;
  completed?: boolean;
};

interface Props {
  events: CalendarEvent[];
  basePath?: string;
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

function compareEvents(a: CalendarEvent, b: CalendarEvent) {
  if ((a.overdue ?? false) !== (b.overdue ?? false)) return a.overdue ? -1 : 1;
  if ((a.completed ?? false) !== (b.completed ?? false)) return a.completed ? 1 : -1;
  if ((a.kind ?? "hearing") !== (b.kind ?? "hearing")) return a.kind === "task" ? -1 : 1;
  return a.title.localeCompare(b.title);
}

function getEventBadgeClass(event: CalendarEvent, isToday: boolean) {
  if (event.kind === "task") {
    if (event.completed) return "bg-emerald-100 text-emerald-700";
    if (event.overdue) return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-800";
  }

  return event.overdue
    ? "bg-red-100 text-red-700"
    : isToday
      ? "bg-emerald-50 text-emerald-700"
      : "bg-gray-100 text-gray-700";
}

export default function CalendarView({ events, basePath, title = "Calendar" }: Props) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const todayKey = toDateKey(new Date());

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const key = event.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }

    for (const key of Object.keys(map)) {
      map[key].sort(compareEvents);
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
  const weekLabel = `${startOfWeek(cursor).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek(cursor).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  function shift(step: number) {
    setCursor(prev => {
      const d = new Date(prev);
      if (view === "week") d.setDate(d.getDate() + step * 7);
      else d.setMonth(d.getMonth() + step);
      return d;
    });
  }

  function resolveHref(event: CalendarEvent) {
    if (event.href) return event.href;
    if (event.kind === "hearing" && basePath) return `${basePath}/${event.id}`;
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{view === "week" ? `Week of ${weekLabel}` : monthLabel}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary btn-sm" onClick={() => shift(-1)}>Prev</button>
            <button className="btn-secondary btn-sm" onClick={() => setCursor(new Date())}>Today</button>
            <button className="btn-secondary btn-sm" onClick={() => shift(1)}>Next</button>
          </div>
          <div className="flex w-fit items-center rounded-lg border border-gray-200 bg-white">
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
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70 text-xs font-semibold uppercase text-gray-400">
              {WEEKDAYS.map(day => (
                <div key={day} className="px-3 py-2">{day}</div>
              ))}
            </div>
            <div className={`grid grid-cols-7 ${view === "week" ? "" : "auto-rows-[110px]"}`}>
              {days.map(day => {
                const key = toDateKey(day);
                const isToday = key === todayKey;
                const inMonth = day.getMonth() === cursor.getMonth();
                const dayEvents = eventsByDate[key] ?? [];
                const hasOverdue = dayEvents.some(event => event.overdue);
                const hasTasks = dayEvents.some(event => event.kind === "task");

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`border-b border-r border-gray-100 p-2.5 text-left transition-colors ${
                      selectedDate === key ? "bg-navy-50/60" : "bg-white"
                    } ${!inMonth && view === "month" ? "text-gray-300" : "text-gray-700"} ${
                      isToday ? "ring-2 ring-navy-200" : hasOverdue ? "ring-2 ring-red-200" : ""
                    } cursor-pointer`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className={`text-xs font-semibold ${isToday ? "text-navy-700" : ""}`}>{day.getDate()}</div>
                      {hasTasks && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Task</span>}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(key);
                            if (event.kind === "task") setActiveEvent(event);
                          }}
                          className={`truncate rounded px-1.5 py-0.5 text-xs ${getEventBadgeClass(event, isToday)}`}
                        >
                          {event.kind === "task" ? "Task: " : ""}
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[11px] text-gray-400">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-700">Schedule on {selectedDate}</h2>
        </div>
        <div className="card-body text-sm">
          {!selectedEvents.length ? (
            <p className="text-gray-400">No hearings or task reminders scheduled for this date.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map(event => {
                const href = resolveHref(event);

                return (
                  <li key={event.id} className="flex flex-col gap-2 rounded-2xl border border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          event.kind === "task" ? "bg-amber-50 text-amber-700" : "bg-navy-50 text-navy-700"
                        }`}>
                          {event.kind === "task" ? "Task" : "Hearing"}
                        </span>
                        {event.overdue && <span className="text-xs font-semibold text-red-600">Overdue</span>}
                        {event.completed && <span className="text-xs font-semibold text-emerald-600">Completed</span>}
                      </div>

                      {event.kind === "task" ? (
                        <button
                          type="button"
                          onClick={() => setActiveEvent(event)}
                          className="text-left font-medium text-gray-900 transition hover:text-navy-700"
                        >
                          {event.title}
                        </button>
                      ) : href ? (
                        <Link className="font-medium text-gray-900 transition hover:text-navy-700 hover:underline" href={href}>
                          {event.title}
                        </Link>
                      ) : (
                        <p className="font-medium text-gray-900">{event.title}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                      {href && (
                        <Link className="text-xs font-semibold text-navy-700 hover:underline" href={href}>
                          Open
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {activeEvent?.kind === "task" && (
        <div className="fixed bottom-5 right-5 z-40 w-[min(380px,calc(100vw-2rem))] rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                activeEvent.kind === "task" ? "text-amber-600" : "text-navy-700"
              }`}>
                {activeEvent.kind === "task" ? "Task Reminder" : "Case Hearing"}
              </p>
              <h2 className="mt-2 text-base font-semibold text-gray-900">{activeEvent.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveEvent(null)}
              className="rounded-full px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-600">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-gray-500">Date</span>
              <span className="text-right text-gray-900">{formatDate(activeEvent.date)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-gray-500">Type</span>
              <span className="text-right text-gray-900">{activeEvent.kind === "task" ? "Task reminder" : "Case hearing"}</span>
            </div>
            {activeEvent.kind === "task" && (
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-500">Status</span>
                <span className={`text-right font-medium ${
                  activeEvent.completed ? "text-emerald-700" : activeEvent.overdue ? "text-red-600" : "text-amber-700"
                }`}>
                  {activeEvent.completed ? "Completed" : activeEvent.overdue ? "Overdue" : "Upcoming"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setActiveEvent(null)} className="btn-secondary btn-sm">
              Close
            </button>
            {resolveHref(activeEvent) && (
              <Link href={resolveHref(activeEvent)!} className="btn-primary btn-sm text-center">
                {activeEvent.actionLabel ?? (activeEvent.kind === "task" ? "Go to tasks" : "Open case")}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
