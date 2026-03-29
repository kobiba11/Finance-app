"use client";

import { LogOut, ShieldAlert } from "lucide-react";

type LogoutDialogProps = {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutDialog({
  open,
  loading = false,
  onCancel,
  onConfirm,
}: LogoutDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[3px]">
      <div className="w-full max-w-[390px] rounded-[2rem] border border-white/40 bg-white/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-500 shadow-sm">
          <ShieldAlert size={28} />
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-2xl font-bold text-slate-900">התנתקות מהאפליקציה</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            האם אתה בטוח שברצונך להתנתק מהחשבון במכשיר הנוכחי?
          </p>
          <p className="mt-1 text-xs text-slate-400">
            תמיד אפשר להתחבר שוב בכל רגע.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
          >
            <LogOut size={16} />
            {loading ? "מתנתק..." : "התנתק"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}