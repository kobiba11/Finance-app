"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gift, Plus, X } from "lucide-react";
import BottomNav from "../components/bottom-nav";
import AddVoucherForm from "./components/add-voucher-form";
import FinanceItemRow from "../components/finance-item-row";
import SwipeableFinanceRow from "../components/swipeable-finance-row";
import ConfirmDeleteDialog from "../components/confirm-delete-dialog";
import { isDateWithinDays, isPastDate } from "src/lib/date-status";

type VoucherItem = {
  id: string;
  name: string;
  company?: string | null;
  value?: number | null;
  currency?: string | null;
  redeem_where?: string | null;
  redemption_platform?: string | null;
  redemption_url?: string | null;
  voucher_code?: string | null;
  expiry_date?: string | null;
  status?: string | null;
};

type Props = {
  householdId: string;
  vouchers: VoucherItem[];
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
      return "פעיל";
    case "active":
      return "פעיל";
    case "used":
      return "נוצל";
    case "expired":
      return "פג תוקף";
    default:
      return "פעיל";
  }
}

export default function VouchersClient({ householdId, vouchers }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<VoucherItem[]>(vouchers);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setItems(vouchers);
  }, [vouchers]);

  const activeTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.status === "used" || item.status === "expired") return sum;
      return sum + Number(item.value || 0);
    }, 0);
  }, [items]);

  const expiringSoonCount = useMemo(() => {
    return items.filter((item) => {
      if (!item.expiry_date) return false;
      if (item.status === "used" || item.status === "expired") return false;
      return isDateWithinDays(item.expiry_date, 14);
    }).length;
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
      .from("vouchers")
      .delete()
      .eq("id", deleteId);

    setDeleting(false);

    if (error) {
      console.error("Delete voucher error:", error);
      setItems(previousItems);
      setMessage(`שגיאה במחיקת השובר: ${error.message}`);
      setDeleteId(null);
      return;
    }

    setDeleteId(null);
    router.refresh();
  };

  const handleEdit = (id: string) => {
    router.push(`/vouchers/${id}/edit`);
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">שוברים</h1>
            <p className="mt-1 text-sm text-slate-500">ניהול שוברים וקופונים</p>
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
            <p className="text-sm text-slate-500">שווי שוברים פעילים</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatCurrency(activeTotal)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">תוקף קרוב</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {expiringSoonCount}
            </p>
          </div>
        </div>

        {isAddOpen && (
          <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">הוספת שובר</h2>

              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <AddVoucherForm
              householdId={householdId}
              onSuccess={() => {
                setIsAddOpen(false);
                router.refresh();
              }}
            />
          </div>
        )}

        <p className="mb-4 text-center text-xs text-slate-400">
          החלק ימינה לעריכה · שמאלה למחיקה
        </p>

        <div className="space-y-3">
          {items.length ? (
            items.map((item) => {
              const expiringSoon = isDateWithinDays(item.expiry_date, 14);
              const isExpired = isPastDate(item.expiry_date);
              const amount = Number(item.value || 0);

              return (
                <div key={item.id} className="space-y-2">
                  <SwipeableFinanceRow
                    onEdit={() => handleEdit(item.id)}
                    onDelete={() => requestDelete(item.id)}
                  >
                    <FinanceItemRow
                      icon={<Gift size={20} />}
                      iconWrapperClassName="bg-purple-100 text-purple-600"
                      title={item.name}
                      subtitle={item.company || "ללא חברה"}
                      amount={formatCurrency(amount, item.currency)}
                      amountClassName="text-purple-600"
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

                          {item.redemption_platform && (
                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                              {item.redemption_platform}
                            </span>
                          )}
                        </>
                      }
                    />
                  </SwipeableFinanceRow>

                  {item.redemption_url && (
                    <div className="px-2">
                      <a
                        href={item.redemption_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm font-medium text-purple-600"
                      >
                        מעבר למימוש
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              עדיין אין שוברים
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
        title="מחיקת שובר"
        description="האם אתה בטוח שברצונך למחוק את השובר? לא ניתן לשחזר לאחר מכן."
        confirmText="מחק שובר"
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