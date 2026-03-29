import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "../components/app-shell";
import BottomNav from "../components/bottom-nav";
import SettingsClient from "./settings-client";
import LogoutCard from "../components/logout-card";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-[430px] px-4 pb-24 pt-6">
          <div className="rounded-[1.75rem] border border-white/35 bg-white/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
            <h1 className="text-3xl font-bold text-slate-900">הגדרות</h1>
            <p className="mt-1 text-sm text-slate-500">
              ניהול תקציב, מטבע ומשק בית
            </p>

            <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
              כדי להשתמש בהגדרות צריך קודם להיות משויך למשק בית.
            </div>
          </div>

          <LogoutCard />
        </main>

        <BottomNav />
      </AppShell>
    );
  }

  const { data: household } = await supabase
    .from("households")
    .select("id, name, base_currency, invite_code")
    .eq("id", membership.household_id)
    .single();

  const currentMonth = new Date();
  const year = currentMonth.getFullYear();
  const monthNumber = String(currentMonth.getMonth() + 1).padStart(2, "0");
  const monthKey = `${year}-${monthNumber}-01`;

  const { data: budgetRow } = await supabase
    .from("monthly_budgets")
    .select("amount, currency, month")
    .eq("household_id", membership.household_id)
    .eq("month", monthKey)
    .maybeSingle();

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[430px] px-4 pb-24 pt-6">
        <SettingsClient
          userId={user.id}
          householdId={membership.household_id}
          role={membership.role}
          householdName={household?.name ?? "המשק שלי"}
          baseCurrency={household?.base_currency ?? "ILS"}
          inviteCode={household?.invite_code ?? ""}
          monthlyBudget={Number(budgetRow?.amount ?? 0)}
        />

        <LogoutCard />
      </main>

      <BottomNav />
    </AppShell>
  );
}