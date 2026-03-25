import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubscriptionsClient from "./subscriptions-client";

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: householdMember } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!householdMember) {
    return (
      <main className="min-h-screen bg-[#f5f7f8] pb-24">
        <div className="mx-auto max-w-[440px] px-4 py-6">
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            לא נמצא household למשתמש
          </div>
        </div>
      </main>
    );
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("household_id", householdMember.household_id)
    .order("created_at", { ascending: false });

  return (
    <SubscriptionsClient
      householdId={householdMember.household_id}
      subscriptions={subscriptions ?? []}
    />
  );
}