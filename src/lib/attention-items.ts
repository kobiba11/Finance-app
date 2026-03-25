import { isDateWithinDays, isPastDate } from "src/lib/date-status";

type SubscriptionItem = {
  id: string;
  name: string;
  renewal_date?: string | null;
  status?: string | null;
};

type VoucherItem = {
  id: string;
  name: string;
  expiry_date?: string | null;
  status?: string | null;
};

type CreditItem = {
  id: string;
  company: string;
  expiry_date?: string | null;
  status?: string | null;
};

export function getRenewingSubscriptions(items: SubscriptionItem[], days = 14) {
  return items.filter((item) => {
    if (!item.renewal_date) return false;
    if (item.status === "cancelled") return false;
    if (isPastDate(item.renewal_date)) return false;
    return isDateWithinDays(item.renewal_date, days);
  });
}

export function getExpiringVouchers(items: VoucherItem[], days = 14) {
  return items.filter((item) => {
    if (!item.expiry_date) return false;
    if (item.status === "used" || item.status === "expired") return false;
    if (isPastDate(item.expiry_date)) return false;
    return isDateWithinDays(item.expiry_date, days);
  });
}

export function getExpiringCredits(items: CreditItem[], days = 14) {
  return items.filter((item) => {
    if (!item.expiry_date) return false;
    if (item.status === "used" || item.status === "expired") return false;
    if (isPastDate(item.expiry_date)) return false;
    return isDateWithinDays(item.expiry_date, days);
  });
}