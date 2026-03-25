import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditVoucherClient from "./edit-voucher-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVoucherPage({ params }: PageProps) {
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
    redirect("/vouchers");
  }

  const { data: voucher, error: voucherError } = await supabase
    .from("vouchers")
    .select("*")
    .eq("id", id)
    .eq("household_id", householdMember.household_id)
    .single();

  if (voucherError || !voucher) {
    redirect("/vouchers");
  }

  return <EditVoucherClient voucher={voucher} />;
}