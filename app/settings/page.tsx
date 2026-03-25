import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "../components/bottom-nav";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <h1 className="text-3xl font-bold text-slate-900">הגדרות</h1>
        <p className="mt-1 text-sm text-slate-500">ניהול תקציב ומשק בית</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">תקציב חודשי</h2>
            <p className="mt-2 text-sm text-slate-500">בהמשך נחבר פה עריכת תקציב אמיתית</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">מטבע</h2>
            <p className="mt-2 text-sm text-slate-500">בהמשך נחבר בחירת מטבע</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">משק בית משותף</h2>
            <p className="mt-2 text-sm text-slate-500">בהמשך נחבר הזמנות ושיתוף</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}