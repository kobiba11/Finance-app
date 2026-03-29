"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CreateSubscriptionInput = {
  household_id: string;
  name: string;
  provider?: string;
  price: number;
  currency: string;
  billing_frequency: "monthly" | "yearly";
  join_date?: string;
  renewal_date?: string;
  has_commitment?: boolean;
  commitment_end_date?: string;
  has_price_increase?: boolean;
  new_price?: number | null;
  price_increase_date?: string;
  management_url?: string;
  notes?: string;
  status?: "active" | "ending_soon" | "cancelled";
};

type CreateVoucherInput = {
  household_id: string;
  name: string;
  company?: string;
  value: number;
  currency: string;
  redeem_where?: string;
  redemption_platform?: string;
  redemption_url?: string;
  voucher_code?: string;
  expiry_date?: string;
  notes?: string;
  image_url?: string;
  imageFile?: File | null;
  source_text?: string;
  status?: "active" | "partially_used" | "used" | "expired";
};

type CreateCreditInput = {
  household_id: string;
  company: string;
  amount: number;
  currency: string;
  received_date?: string;
  expiry_date?: string;
  reason?: string;
  redeem_method?: string;
  contact_info?: string;
  notes?: string;
  status?: "available" | "partially_used" | "used" | "expired";
};

export async function createSubscription(input: CreateSubscriptionInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("subscriptions").insert({
    ...input,
    created_by: user?.id ?? null,
    has_commitment: input.has_commitment ?? false,
    has_price_increase: input.has_price_increase ?? false,
    status: input.status ?? "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function createVoucher(input: CreateVoucherInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let imageUrl = input.image_url ?? null;

  if (input.imageFile) {
    const originalName = input.imageFile.name || "voucher-image";
    const fileExt = originalName.includes(".")
      ? originalName.split(".").pop()
      : "jpg";

    const safeExt = fileExt?.toLowerCase() || "jpg";
    const fileName = `${input.household_id}/${user?.id ?? "anonymous"}/${Date.now()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("vouchers")
      .upload(fileName, input.imageFile, {
        upsert: false,
        contentType: input.imageFile.type || undefined,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("vouchers")
      .getPublicUrl(fileName);

    imageUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from("vouchers").insert({
    household_id: input.household_id,
    name: input.name,
    company: input.company ?? null,
    value: input.value,
    currency: input.currency,
    redeem_where: input.redeem_where ?? null,
    redemption_platform: input.redemption_platform ?? null,
    redemption_url: input.redemption_url ?? null,
    voucher_code: input.voucher_code ?? null,
    expiry_date: input.expiry_date ?? null,
    notes: input.notes ?? null,
    image_url: imageUrl,
    source_text: input.source_text ?? null,
    created_by: user?.id ?? null,
    status: input.status ?? "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/vouchers");
  revalidatePath("/dashboard");
}

export async function createCredit(input: CreateCreditInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("credits").insert({
    ...input,
    created_by: user?.id ?? null,
    status: input.status ?? "available",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/credits");
  revalidatePath("/dashboard");
}