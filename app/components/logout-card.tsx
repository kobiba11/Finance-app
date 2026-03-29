"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import LogoutDialog from "./logout-dialog";

export default function LogoutCard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage("ההתנתקות נכשלה. נסה שוב.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("קרתה שגיאה לא צפויה בעת ההתנתקות.");
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <section className="mt-4 rounded-[1.75rem] border border-white/35 bg-white/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">התנתקות</h2>
            <p className="mt-1 text-sm text-slate-500">
              יציאה מהחשבון במכשיר הנוכחי
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <LogOut size={18} />
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
        >
          <LogOut size={16} />
          {loading ? "מתנתק..." : "התנתק"}
        </button>
      </section>

      <LogoutDialog
        open={dialogOpen}
        loading={loading}
        onCancel={() => {
          if (!loading) setDialogOpen(false);
        }}
        onConfirm={handleLogout}
      />
    </>
  );
}