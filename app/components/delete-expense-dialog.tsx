"use client";

type DeleteExpenseDialogProps = {
  open: boolean;
  title?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteExpenseDialog({
  open,
  title,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteExpenseDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-[420px] rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">מחיקת הוצאה</h3>
          <p className="mt-2 text-sm text-slate-600">
            {title
              ? `האם למחוק את ההוצאה "${title}"?`
              : "האם למחוק את ההוצאה הזו?"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            פעולה זו לא ניתנת לשחזור.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            ביטול
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "מוחק..." : "מחק"}
          </button>
        </div>
      </div>
    </div>
  );
}