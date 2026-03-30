"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass = tone === "danger" ? "btn-danger" : "btn-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <h2 className="max-w-full break-words text-left text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-3 max-w-full whitespace-normal break-words text-sm leading-6 text-gray-500">
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary btn-sm">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`${confirmClass} btn-sm`}>
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
