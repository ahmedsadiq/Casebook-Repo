"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export default function DocumentUploadButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";

    if (!selectedFile) return;

    if (selectedFile.size > MAX_DOCUMENT_SIZE) {
      setError("Document must be smaller than 20MB.");
      setSuccess(null);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be signed in to upload documents.");

      const storagePath = `${caseId}/${Date.now()}-${sanitizeFileName(selectedFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(storagePath, selectedFile, {
          upsert: false,
          contentType: selectedFile.type || undefined,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("case_documents").insert({
        case_id: caseId,
        uploader_id: user.id,
        name: selectedFile.name,
        storage_path: storagePath,
        size_bytes: selectedFile.size,
      });

      if (insertError) throw insertError;

      setSuccess("Document uploaded. Updating the list...");
      startRefresh(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  const isBusy = uploading || isRefreshing;

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <button type="button" className="btn-secondary btn-sm" onClick={openFilePicker} disabled={isBusy}>
        {uploading ? "Uploading..." : isRefreshing ? "Updating..." : "+ Upload"}
      </button>
      {error && <p className="max-w-[220px] text-right text-xs text-red-600">{error}</p>}
      {!error && success && <p className="max-w-[220px] text-right text-xs text-gray-500">{success}</p>}
      {!error && !success && <p className="text-right text-xs text-gray-400">Select a file under 20MB.</p>}
    </div>
  );
}
