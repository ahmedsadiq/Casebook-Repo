"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  case_id?: string | null;
};

type CaseOption = {
  id: string;
  title: string;
};

interface Props {
  initialTasks: Task[];
  caseOptions?: CaseOption[];
  casePathBase?: string;
  initialSelectedCaseId?: string;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export default function TasksWidget({
  initialTasks,
  caseOptions = [],
  casePathBase = "/advocate/cases",
  initialSelectedCaseId = "",
}: Props) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(sortTasks(initialTasks));
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [caseId, setCaseId] = useState(initialSelectedCaseId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCaseId, setEditCaseId] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);

  const caseMap = useMemo(
    () => Object.fromEntries(caseOptions.map((caseOption) => [caseOption.id, caseOption.title])),
    [caseOptions],
  );

  function getErrorMessage(err: unknown): string {
    if (!err) return "Something went wrong.";
    if (typeof err === "string") return err;
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    if (e.code === "AUTH") return "You must be signed in to add tasks.";
    if (e.code === "42501") return "You do not have permission to modify tasks.";
    if (e.code === "23502") return "Task title is required.";
    if (e.message?.toLowerCase().includes("jwt")) return "Your session expired. Please sign in again.";
    if (e.message?.toLowerCase().includes("network")) return "Network error. Please try again.";
    return e.details || e.message || "Something went wrong.";
  }

  const visibleTasks = useMemo(() => {
    const list = hideCompleted ? tasks.filter((task) => !task.completed) : tasks;
    return sortTasks(list);
  }, [tasks, hideCompleted]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw { code: "AUTH" };

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({ user_id: user.id, title: title.trim(), due_date: dueDate || null, case_id: caseId || null })
        .select("id,title,due_date,completed,created_at,case_id")
        .single();

      if (insertError) throw insertError;

      setTasks((prev) => sortTasks([data as Task, ...prev]));
      setTitle("");
      setDueDate("");
      setCaseId(initialSelectedCaseId);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(task: Task) {
    const next = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: next } : t)));

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ completed: next })
      .eq("id", task.id);

    if (updateError) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
      setError(getErrorMessage(updateError));
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.due_date ?? "");
    setEditCaseId(task.case_id ?? "");
  }

  async function saveEdit(taskId: string) {
    if (!editTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    setError(null);

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ title: editTitle.trim(), due_date: editDueDate || null, case_id: editCaseId || null })
      .eq("id", taskId);

    if (updateError) {
      setError(getErrorMessage(updateError));
      return;
    }

    setTasks((prev) => prev.map((task) => (
      task.id === taskId
        ? { ...task, title: editTitle.trim(), due_date: editDueDate || null, case_id: editCaseId || null }
        : task
    )));
    setEditingId(null);
  }

  async function deleteTask(taskId: string) {
    const prev = tasks;
    setTasks(prev.filter((task) => task.id !== taskId));
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", taskId);
    if (deleteError) {
      setTasks(prev);
      setError(getErrorMessage(deleteError));
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
          {caseOptions.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">Link tasks to a case so hearings, reminders, and follow-up work stay connected.</p>
          )}
        </div>
        <button className="btn-ghost btn-sm" onClick={() => setHideCompleted((value) => !value)}>
          {hideCompleted ? "Show completed" : "Hide completed"}
        </button>
      </div>
      <div className="card-body space-y-4">
        <form onSubmit={addTask} className="space-y-3">
          {error && <div className="alert-error">{error}</div>}
          <div className={`grid grid-cols-1 gap-3 ${caseOptions.length > 0 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            <input
              className={`input ${caseOptions.length > 0 ? "md:col-span-2" : "md:col-span-2"}`}
              placeholder="Add a task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {caseOptions.length > 0 && (
              <select className="input" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
                <option value="">General task</option>
                {caseOptions.map((caseOption) => (
                  <option key={caseOption.id} value={caseOption.id}>
                    {caseOption.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button className="btn-primary btn-sm" disabled={saving}>
            {saving ? "Adding..." : "Add Task"}
          </button>
        </form>

        {!visibleTasks.length ? (
          <p className="text-sm text-gray-400">No tasks yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {visibleTasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} />
                  <div>
                    {editingId === task.id ? (
                      <div className="space-y-2">
                        <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        <input type="date" className="input" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                        {caseOptions.length > 0 && (
                          <select className="input" value={editCaseId} onChange={(e) => setEditCaseId(e.target.value)}>
                            <option value="">General task</option>
                            {caseOptions.map((caseOption) => (
                              <option key={caseOption.id} value={caseOption.id}>
                                {caseOption.title}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <button className="btn-primary btn-sm" type="button" onClick={() => saveEdit(task.id)}>Save</button>
                          <button className="btn-secondary btn-sm" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-xs ${task.completed ? "text-gray-300" : "text-gray-500"}`}>
                            {task.due_date ? `Due ${formatDate(task.due_date)}` : "No due date"}
                          </p>
                          {task.case_id && caseMap[task.case_id] && (
                            <Link
                              href={`${casePathBase}/${task.case_id}`}
                              className="inline-flex rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold text-navy-700 hover:bg-navy-100"
                            >
                              {caseMap[task.case_id]}
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {editingId !== task.id && (
                  <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                    <button className="btn-ghost btn-sm" type="button" onClick={() => startEdit(task)}>Edit</button>
                    <button className="btn-ghost btn-sm text-red-600" type="button" onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
