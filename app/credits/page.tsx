export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreditsClient from "./credits-client";

export default async function CreditsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: householdMember, error: householdError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (householdError || !householdMember) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-500 pb-24">
        <div className="mx-auto max-w-[440px] px-4 py-6">
          <div className="rounded-[2rem] border border-white/35 bg-white/92 p-6 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            לא נמצא household למשתמש
          </div>
        </div>
      </main>
    );
  }

  const { data: credits, error: creditsError } = await supabase
    .from("credits")
    .select("*")
    .eq("household_id", householdMember.household_id)
    .order("created_at", { ascending: false });

  if (creditsError) {
    console.error("Failed to load credits:", creditsError);
  }

  return (
    <CreditsClient
      householdId={householdMember.household_id}
      credits={credits ?? []}
    />
  );
}