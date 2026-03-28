"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Wallet, X, BadgePercent, Clock3 } from "lucide-react";
import BottomNav from "../components/bottom-nav";
import AddCreditForm from "./components/add-credit-form";
import FinanceItemRow from "../components/finance-item-row";
import SwipeableFinanceRow from "../components/swipeable-finance-row";
import ConfirmDeleteDialog from "../components/confirm-delete-dialog";
import { isDateWithinDays, isPastDate } from "src/lib/date-status";

type CreditItem = {
  id: string;
  company: string;
  amount?: number | null;
  currency?: string | null;
  received_date?: string | null;
  expiry_date?: string | null;
  reason?: string | null;
  redeem_method?: string | null;
  contact_info?: string | null;
  status?: string | null;
};

type Props = {
  householdId: string;
  credits: CreditItem[];
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
  if (!date) return "ללא תוקף";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("he-IL");
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "available":
      return "זמין";
    case "partially_used":
      return "נוצל חלקית";
    case "used":
      return "נוצל";
    case "expired":
      return "פג תוקף";
    default:
      return "זמין";
  }
}

export default function CreditsClient({ householdId, credits }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<CreditItem[]>(credits);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setItems(credits);
  }, [credits]);

  const availableTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.status === "used" || item.status === "expired") return sum;
      return sum + Number(item.amount || 0);
    }, 0);
  }, [items]);

  const openCount = useMemo(() => {
    return items.filter(
      (item) => item.status === "available" || item.status === "partially_used"
    ).length;
  }, [items]);

  const expiringSoonCount = useMemo(() => {
    return items.filter(
      (item) =>
        (item.status === "available" || item.status === "partially_used") &&
        isDateWithinDays(item.expiry_date, 14) &&
        !isPastDate(item.expiry_date)
    ).length;
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
      .from("credits")
      .delete()
      .eq("id", deleteId);

    setDeleting(false);

    if (error) {
      console.error("Delete credit error:", error);
      setItems(previousItems);
      setMessage(`שגיאה במחיקת הזיכוי: ${error.message}`);
      setDeleteId(null);
      return;
    }

    setDeleteId(null);
    router.refresh();
  };

  const handleEdit = (id: string) => {
    router.push(`/credits/${id}/edit`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">ניהול זיכויים והחזרים</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">זיכויים</h1>
              <p className="mt-1 text-sm text-slate-500">
                מעקב אחרי החזרים, יתרות ותוקף
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Plus size={18} />
              הוסף
            </button>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Wallet size={18} />
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(availableTotal)}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">זיכויים זמינים</p>
          </div>

          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <BadgePercent size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{openCount}</p>
            <p className="mt-1 text-[10px] text-slate-500">פתוחים</p>
          </div>

          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
              <Clock3 size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{expiringSoonCount}</p>
            <p className="mt-1 text-[10px] text-slate-500">פגים בקרוב</p>
          </div>
        </section>

        {isAddOpen && (
          <section className="mb-5 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">הוספת זיכוי</h2>
                <p className="mt-1 text-sm text-slate-500">מלא את פרטי הזיכוי ושמור</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <AddCreditForm
              householdId={householdId}
              onSuccess={() => {
                setIsAddOpen(false);
                router.refresh();
              }}
            />
          </section>
        )}

        <p className="mb-4 text-center text-xs text-white/80">
          החלק ימינה לעריכה · שמאלה למחיקה
        </p>

        <div className="space-y-3">
          {items.length ? (
            items.map((item) => {
              const expiringSoon = isDateWithinDays(item.expiry_date, 14);
              const isExpired = isPastDate(item.expiry_date);
              const amount = Number(item.amount || 0);

              return (
                <SwipeableFinanceRow
                  key={item.id}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => requestDelete(item.id)}
                >
                  <FinanceItemRow
                    icon={<Wallet size={20} />}
                    iconWrapperClassName="bg-emerald-100 text-emerald-600"
                    title={item.company}
                    subtitle={item.reason || "ללא פירוט"}
                    amount={formatCurrency(amount, item.currency)}
                    amountClassName="text-emerald-600"
                    meta={formatDate(item.expiry_date)}
                    badges={
                      <>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {getStatusLabel(item.status)}
                        </span>

                        {expiringSoon && !isExpired && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            פג בקרוב
                          </span>
                        )}

                        {isExpired && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                            פג תוקף
                          </span>
                        )}

                        {item.redeem_method && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {item.redeem_method}
                          </span>
                        )}
                      </>
                    }
                  />
                </SwipeableFinanceRow>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-white/35 bg-white/92 p-6 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              עדיין אין זיכויים
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
        title="מחיקת זיכוי"
        description="האם אתה בטוח שברצונך למחוק את הזיכוי? לא ניתן לשחזר לאחר מכן."
        confirmText="מחק זיכוי"
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