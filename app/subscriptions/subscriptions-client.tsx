"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCcw, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

  const activeCount = useMemo(() => {
    return items.filter((item) => item.status === "active" || !item.status).length;
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
    <main className="min-h-screen bg-gradient-to-b from-teal-300 via-cyan-400 to-teal-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">ניהול חיובים קבועים</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">מנויים</h1>
              <p className="mt-1 text-sm text-slate-500">
                שליטה על כל התשלומים החוזרים שלך
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              <Plus size={18} />
              הוסף
            </button>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <RefreshCcw size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{items.length}</p>
            <p className="mt-1 text-[10px] text-slate-500">סה״כ מנויים</p>
          </div>

          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
              <Sparkles size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(monthlyTotal)}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">עלות חודשית</p>
          </div>

          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <RefreshCcw size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{activeCount}</p>
            <p className="mt-1 text-[10px] text-slate-500">פעילים</p>
          </div>
        </section>

        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">סיכום מנויים</h2>
            <span className="text-xs text-slate-500">חיוב חודשי מול שנתי</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs text-slate-500">עלות שנתית</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(yearlyTotal)}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs text-slate-500">עלות חודשית</p>
              <p className="mt-1 text-2xl font-bold text-teal-600">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>
          </div>
        </section>

        {isAddOpen && (
          <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">הוספת מנוי</h2>
                <p className="mt-1 text-sm text-slate-500">
                  מלא את הפרטים ושמור
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <AddSubscriptionForm
              householdId={householdId}
              onSuccess={() => setIsAddOpen(false)}
            />
          </section>
        )}

        <p className="mb-4 text-center text-xs text-white/80">
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
                    iconWrapperClassName="bg-teal-100 text-teal-600"
                    title={item.name}
                    subtitle={item.provider || "ללא חברה"}
                    amount={`${formatCurrency(price, item.currency)} / ${getBillingFrequencyLabel(
                      item.billing_frequency
                    )}`}
                    amountClassName="text-teal-600"
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

                        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                          {getBillingFrequencyLabel(item.billing_frequency)}
                        </span>
                      </>
                    }
                  />
                </SwipeableFinanceRow>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-white/35 bg-white/92 p-6 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              עדיין אין מנויים
            </div>
          )}
        </div>

        {message && (
          <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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