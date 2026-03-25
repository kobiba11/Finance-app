"use client";

type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteDialog({
  open,
  title = "מחיקת פריט",
  description = "האם אתה בטוח שברצונך למחוק את הפריט? לא ניתן לשחזר לאחר מכן.",
  confirmText = "מחק",
  cancelText = "ביטול",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-6 pt-20 sm:items-center">
      <div className="w-full max-w-[420px] rounded-3xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "מוחק..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}