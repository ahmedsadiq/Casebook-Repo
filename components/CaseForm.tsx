"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Case, CaseStatus } from "@/lib/supabase/types";

interface Props {
  mode: "create" | "edit";
  existingCase?: Case;
}

export default function CaseForm({ mode, existingCase }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(existingCase?.title ?? "");
  const [description, setDescription] = useState(existingCase?.description ?? "");
  const [status, setStatus] = useState<CaseStatus>(existingCase?.status ?? "open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "create") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("cases")
          .insert({ title, description: description || null, status, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        router.push(`/cases/${data.id}`);
        router.refresh();
      } else if (existingCase) {
        const { error } = await supabase
          .from("cases")
          .update({ title, description: description || null, status })
          .eq("id", existingCase.id);

        if (error) throw error;
        router.push(`/cases/${existingCase.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="label" htmlFor="title">Case title <span className="text-red-500">*</span></label>
        <input
          id="title"
          type="text"
          className="input"
          placeholder="e.g. Smith v. Jones"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="status">Status</label>
        <select
          id="status"
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as CaseStatus)}
        >
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="input resize-none"
          rows={5}
          placeholder="Add case details, notes, or context…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create Case" : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
