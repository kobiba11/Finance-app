export type Currency = "ILS" | "USD" | "EUR";

export type SubscriptionStatus = "active" | "ending_soon" | "cancelled";
export type BillingFrequency = "monthly" | "yearly";

export type VoucherStatus = "active" | "partially_used" | "used" | "expired";

export type CreditStatus = "available" | "partially_used" | "used" | "expired";

export type SubscriptionRow = {
  id: string;
  household_id: string;
  created_by: string | null;
  name: string;
  provider: string | null;
  price: number;
  currency: Currency;
  billing_frequency: BillingFrequency;
  join_date: string | null;
  renewal_date: string | null;
  has_commitment: boolean;
  commitment_end_date: string | null;
  has_price_increase: boolean;
  new_price: number | null;
  price_increase_date: string | null;
  management_url: string | null;
  notes: string | null;
  status: SubscriptionStatus;
  alert_days: number[] | null;
  created_at: string;
  updated_at: string;
};

export type VoucherRow = {
  id: string;
  household_id: string;
  created_by: string | null;
  name: string;
  company: string | null;
  value: number;
  currency: Currency;
  redeem_where: string | null;
  redemption_platform: string | null;
  redemption_url: string | null;
  voucher_code: string | null;
  expiry_date: string | null;
  notes: string | null;
  image_url: string | null;
  status: VoucherStatus;
  created_at: string;
  updated_at: string;
};

export type CreditRow = {
  id: string;
  household_id: string;
  created_by: string | null;
  company: string;
  amount: number;
  currency: Currency;
  received_date: string | null;
  expiry_date: string | null;
  reason: string | null;
  redeem_method: string | null;
  contact_info: string | null;
  notes: string | null;
  status: CreditStatus;
  created_at: string;
  updated_at: string;
};