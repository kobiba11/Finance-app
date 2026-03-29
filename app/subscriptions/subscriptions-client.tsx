"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCcw,
  X,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../components/bottom-nav";
import AddSubscriptionForm from "./components/add-subscription-form";
import FinanceItemRow from "../components/finance-item-row";
import SwipeableFinanceRow from "../components/swipeable-finance-row";
import ConfirmDeleteDialog from "../components/confirm-delete-dialog";

type SubscriptionItem = {
  id: string;
  name: string;
  provider?: string | null;
  price?: number | null;
  currency?: string | null;
  billing_frequency?: "monthly" | "yearly" | null;
  renewal_date?: string | null;
  status?: string | null;
  join_date?: string | null;
  has_commitment?: boolean | null;
  commitment_end_date?: string | null;
  has_price_increase?: boolean | null;
  new_price?: number | null;
  price_increase_date?: string | null;
  management_url?: string | null;
  notes?: string | null;
};

type Props = {
  householdId: string;
  subscriptions: SubscriptionItem[];
};

type FrequencyFilter = "all" | "monthly" | "yearly";
type StatusFilter =
  | "all"
  | "active"
  | "cancelled"
  | "paused"
  | "expired"
  | "ending_soon";

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
  if (!date) return "—";

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
    case "ending_soon":
      return "עומד להסתיים";
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

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
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

  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] =
    useState<FrequencyFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    setItems(subscriptions);
  }, [subscriptions]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        normalizeText(item.name).includes(normalizeText(search)) ||
        normalizeText(item.provider).includes(normalizeText(search));

      const matchesFrequency =
        frequencyFilter === "all" ||
        (item.billing_frequency || "monthly") === frequencyFilter;

      const resolvedStatus = item.status || "active";
      const matchesStatus =
        statusFilter === "all" || resolvedStatus === statusFilter;

      const itemDate = item.renewal_date ? new Date(item.renewal_date) : null;
      const validItemDate =
        itemDate && !Number.isNaN(itemDate.getTime()) ? itemDate : null;

      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      const matchesDate =
        (!from && !to) ||
        (!!validItemDate &&
          (!from || validItemDate >= from) &&
          (!to || validItemDate <= to));

      return matchesSearch && matchesFrequency && matchesStatus && matchesDate;
    });
  }, [items, search, frequencyFilter, statusFilter, fromDate, toDate]);

  const monthlyTotal = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      const price = Number(item.price || 0);

      if (item.billing_frequency === "yearly") {
        return sum + price / 12;
      }

      return sum + price;
    }, 0);
  }, [filteredItems]);

  const yearlyTotal = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      const price = Number(item.price || 0);

      if (item.billing_frequency === "monthly") {
        return sum + price * 12;
      }

      return sum + price;
    }, 0);
  }, [filteredItems]);

  const activeCount = useMemo(() => {
    return filteredItems.filter(
      (item) => item.status === "active" || !item.status
    ).length;
  }, [filteredItems]);

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

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasAdvancedFilters =
    statusFilter !== "all" || fromDate.length > 0 || toDate.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-300 via-cyan-400 to-teal-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                ניהול חיובים קבועים
              </p>
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

        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  חיפוש ופילטרים
                </p>
                <p className="text-xs text-slate-500">
                  חפש לפי שם מנוי או ספק
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                isFiltersOpen || hasAdvancedFilters
                  ? "border-teal-200 bg-teal-50 text-teal-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Filter size={18} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש מנוי..."
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300"
            />
          </div>

          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
            סינון לפי תדירות
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "הכול" },
              { value: "monthly", label: "חודשי" },
              { value: "yearly", label: "שנתי" },
            ].map((option) => {
              const isActive = frequencyFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFrequencyFilter(option.value as FrequencyFilter)
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-teal-500 text-white shadow-[0_12px_30px_rgba(20,184,166,0.25)]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {isFiltersOpen && (
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">
                  פילטרים מתקדמים
                </p>

                {hasAdvancedFilters && (
                  <button
                    type="button"
                    onClick={clearAdvancedFilters}
                    className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
                  >
                    נקה
                  </button>
                )}
              </div>

              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                סינון לפי סטטוס
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { value: "all", label: "הכול" },
                  { value: "active", label: "פעיל" },
                  { value: "cancelled", label: "בוטל" },
                  { value: "paused", label: "מושהה" },
                  { value: "expired", label: "פג" },
                  { value: "ending_soon", label: "עומד להסתיים" },
                ].map((option) => {
                  const isActive = statusFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setStatusFilter(option.value as StatusFilter)
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                טווח תאריכים
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    מתאריך
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    עד תאריך
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-300"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <RefreshCcw size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">
              {filteredItems.length}
            </p>
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
                <h2 className="text-xl font-bold text-slate-900">
                  הוספת מנוי
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  נוסיף את המנוי שלך בכמה שניות
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
          לחץ על פרטים להצגת מידע · החלק ימינה לעריכה · שמאלה למחיקה
        </p>

        <div className="space-y-3">
          {filteredItems.length ? (
            filteredItems.map((item) => {
              const price = Number(item.price || 0);
              const isExpanded = expandedId === item.id;

              return (
                <SwipeableFinanceRow
                  key={item.id}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => requestDelete(item.id)}
                >
                  <div className="overflow-hidden rounded-[2rem] bg-white">
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

                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                            {getBillingFrequencyLabel(item.billing_frequency)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(item.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                          >
                            {isExpanded ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                            פרטים
                          </button>
                        </>
                      }
                    />

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 text-sm text-slate-700">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <span className="font-semibold text-slate-900">
                                שם מנוי:
                              </span>{" "}
                              {item.name || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                חברה / שירות:
                              </span>{" "}
                              {item.provider || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                מחיר:
                              </span>{" "}
                              {formatCurrency(price, item.currency)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                מטבע:
                              </span>{" "}
                              {item.currency || "ILS"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                תדירות:
                              </span>{" "}
                              {getBillingFrequencyLabel(item.billing_frequency)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                תאריך חיוב הבא:
                              </span>{" "}
                              {formatDate(item.renewal_date)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                תאריך הצטרפות:
                              </span>{" "}
                              {formatDate(item.join_date)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                סטטוס:
                              </span>{" "}
                              {getStatusLabel(item.status)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                יש התחייבות:
                              </span>{" "}
                              {item.has_commitment ? "כן" : "לא"}
                            </div>

                            {item.has_commitment && (
                              <div>
                                <span className="font-semibold text-slate-900">
                                  סיום התחייבות:
                                </span>{" "}
                                {formatDate(item.commitment_end_date)}
                              </div>
                            )}

                            <div>
                              <span className="font-semibold text-slate-900">
                                יש שינוי מחיר צפוי:
                              </span>{" "}
                              {item.has_price_increase ? "כן" : "לא"}
                            </div>

                            {item.has_price_increase && (
                              <>
                                <div>
                                  <span className="font-semibold text-slate-900">
                                    מחיר חדש:
                                  </span>{" "}
                                  {item.new_price
                                    ? formatCurrency(
                                        Number(item.new_price),
                                        item.currency
                                      )
                                    : "—"}
                                </div>

                                <div>
                                  <span className="font-semibold text-slate-900">
                                    תאריך שינוי מחיר:
                                  </span>{" "}
                                  {formatDate(item.price_increase_date)}
                                </div>
                              </>
                            )}

                            <div>
                              <span className="font-semibold text-slate-900">
                                קישור לניהול:
                              </span>{" "}
                              {item.management_url ? (
                                <a
                                  href={item.management_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="break-all text-teal-700 underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  פתח קישור
                                </a>
                              ) : (
                                "—"
                              )}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">
                                הערות:
                              </span>{" "}
                              {item.notes || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SwipeableFinanceRow>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-white/35 bg-white/92 p-6 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              לא נמצאו מנויים תואמים
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