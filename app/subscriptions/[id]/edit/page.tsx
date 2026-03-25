import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditSubscriptionClient from "./edit-subscription-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSubscriptionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !subscription) {
    redirect("/subscriptions");
  }

  return <EditSubscriptionClient subscription={subscription} />;
}