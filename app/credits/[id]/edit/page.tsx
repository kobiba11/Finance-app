import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditCreditClient from "./edit-credit-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCreditPage({ params }: PageProps) {
  const { id } = await params;
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
    redirect("/credits");
  }

  const { data: credit, error: creditError } = await supabase
    .from("credits")
    .select("*")
    .eq("id", id)
    .eq("household_id", householdMember.household_id)
    .single();

  if (creditError || !credit) {
    redirect("/credits");
  }

  return <EditCreditClient credit={credit} />;
}