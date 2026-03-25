"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, RefreshCcw, X } from "lucide-react";
import BottomNav from "../components/bottom-nav";
import AddSubscriptionForm from "./components/add-subscription-form";
import FinanceItemRow from "../components/finance-item-row";
import SwipeableFinanceRow from "../components/swipeable-finance-row";
import ConfirmDeleteDialog from "../components/confirm-delete-dialog";
import { isDateWithinDays, isPastDate } from "@/lib/date-status";

type SubscriptionItem = {
  id: string;
  name: string;
  provider?: string | null;
  price?: number | null;
  currency?: string | null;
  billing_frequency?: "monthly" | "yearly" | null;
  renewal_date?: string | null;
  status?: string | null;
};

type Props = {
  householdId: string;
  subscriptions: SubscriptionItem[];
};

function formatCurrency(amount: number, currency?: string | null) {
  const safeCurrency = currency || "ILS";

  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₪${amount.toFixed(0)}`;
  }
}

function formatDate(date?: string | null) {
  if (!date) return "ללא תאריך";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("he-IL");
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "active":
      return "פעיל";
    case "paused":
      return "מושהה";
    case "cancelled":
      return "בוטל";
    case "expired":
      return "פג";
    default:
      return "פעיל";
  }
}

function getBillingFrequencyLabel(
  billingFrequency?: "monthly" | "yearly" | null
) {
  switch (billingFrequency) {
    case "yearly":
      return "שנתי";
    case "monthly":
      return "חודשי";
    default:
      return "חודשי";
  }
}

export default function SubscriptionsClient({
  householdId,
  subscriptions,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<SubscriptionItem[]>(subscriptions);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setItems(subscriptions);
  }, [subscriptions]);

  const monthlyTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price || 0);

      if (item.billing_frequency === "yearly") {
        return sum + price / 12;
      }

      return sum + price;
    }, 0);
  }, [items]);

  const yearlyTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price || 0);

      if (item.billing_frequency === "monthly") {
        return sum + price * 12;
      }

      return sum + price;
    }, 0);
  }, [items]);

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const previousItems = items;
    setDeleting(true);
    setMessage("");
    setItems((current) => current.filter((item) => item.id !== deleteId));

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", deleteId);

    setDeleting(false);

    if (error) {
      setItems(previousItems);
      setMessage("שגיאה במחיקת המנוי.");
      setDeleteId(null);
      return;
    }

    setDeleteId(null);
  };

  const handleEdit = (id: string) => {
    router.push(`/subscriptions/${id}/edit`);
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">מנויים</h1>
            <p className="mt-1 text-sm text-slate-500">
              ניהול מנויים ותשלומים חוזרים
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
          >
            <Plus size={18} />
            הוסף
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">עלות שנתית</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency(yearlyTotal)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">עלות חודשית</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
        </div>

        {isAddOpen && (
          <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">הוספת מנוי</h2>

              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <AddSubscriptionForm
              householdId={householdId}
              onSuccess={() => setIsAddOpen(false)}
            />
          </div>
        )}

        <p className="mb-4 text-center text-xs text-slate-400">
          החלק ימינה לעריכה · שמאלה למחיקה
        </p>

        <div className="space-y-3">
          {items.length ? (
            items.map((item) => {
              const renewingSoon = isDateWithinDays(item.renewal_date, 14);
              const isExpired = isPastDate(item.renewal_date);
              const price = Number(item.price || 0);

              return (
                <SwipeableFinanceRow
                  key={item.id}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => requestDelete(item.id)}
                >
                  <FinanceItemRow
                    icon={<RefreshCcw size={20} />}
                    iconWrapperClassName="bg-blue-100 text-blue-600"
                    title={item.name}
                    subtitle={item.provider || "ללא חברה"}
                    amount={`${formatCurrency(price, item.currency)} / ${getBillingFrequencyLabel(
                      item.billing_frequency
                    )}`}
                    amountClassName="text-blue-600"
                    meta={formatDate(item.renewal_date)}
                    badges={
                      <>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {getStatusLabel(item.status)}
                        </span>

                        {renewingSoon && !isExpired && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            מתחדש בקרוב
                          </span>
                        )}

                        {isExpired && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                            עבר תאריך
                          </span>
                        )}

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {getBillingFrequencyLabel(item.billing_frequency)}
                        </span>
                      </>
                    }
                  />
                </SwipeableFinanceRow>
              );
            })
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              עדיין אין מנויים
            </div>
          )}
        </div>

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
            {message}
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteId}
        title="מחיקת מנוי"
        description="האם אתה בטוח שברצונך למחוק את המנוי? לא ניתן לשחזר לאחר מכן."
        confirmText="מחק מנוי"
        cancelText="ביטול"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteId(null);
        }}
      />

      <BottomNav />
    </main>
  );
}