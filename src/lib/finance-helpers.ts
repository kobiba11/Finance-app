import { CreditRow, SubscriptionRow, VoucherRow } from "@/types/finance";

export function calculateMonthlySubscriptionsTotal(items: SubscriptionRow[]) {
  return items
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => {
      if (item.billing_frequency === "monthly") return sum + Number(item.price);
      if (item.billing_frequency === "yearly") return sum + Number(item.price) / 12;
      return sum;
    }, 0);
}

export function calculateYearlySubscriptionsTotal(items: SubscriptionRow[]) {
  return items
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => {
      if (item.billing_frequency === "monthly") return sum + Number(item.price) * 12;
      if (item.billing_frequency === "yearly") return sum + Number(item.price);
      return sum;
    }, 0);
}

export function calculateAvailableCreditsTotal(items: CreditRow[]) {
  return items
    .filter((item) => item.status === "available" || item.status === "partially_used")
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

export function getExpiringSoonVouchers(items: VoucherRow[], days = 14) {
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);

  return items.filter((item) => {
    if (!item.expiry_date) return false;
    const expiry = new Date(item.expiry_date);
    return expiry >= now && expiry <= limit && item.status !== "used" && item.status !== "expired";
  });
}

export function getRenewingSoonSubscriptions(items: SubscriptionRow[], days = 14) {
  const now = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + days);

  return items.filter((item) => {
    if (!item.renewal_date) return false;
    const renewal = new Date(item.renewal_date);
    return renewal >= now && renewal <= limit && item.status === "active";
  });
}