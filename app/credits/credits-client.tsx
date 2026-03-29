"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Wallet,
  X,
  BadgePercent,
  Clock3,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
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
  notes?: string | null;
};

type Props = {
  householdId: string;
  credits: CreditItem[];
};

type StatusFilter = "all" | "available" | "partially_used" | "used" | "expired";

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

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

export default function CreditsClient({ householdId, credits }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<CreditItem[]>(credits);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    setItems(credits);
  }, [credits]);

  const filteredCredits = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        normalizeText(item.company).includes(normalizeText(search)) ||
        normalizeText(item.reason).includes(normalizeText(search)) ||
        normalizeText(item.redeem_method).includes(normalizeText(search)) ||
        normalizeText(item.contact_info).includes(normalizeText(search));

      const resolvedStatus = (item.status || "available") as StatusFilter;
      const matchesStatus =
        statusFilter === "all" || resolvedStatus === statusFilter;

      const itemDate = item.expiry_date ? new Date(item.expiry_date) : null;
      const validItemDate =
        itemDate && !Number.isNaN(itemDate.getTime()) ? itemDate : null;

      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      const matchesDate =
        (!from && !to) ||
        (!!validItemDate &&
          (!from || validItemDate >= from) &&
          (!to || validItemDate <= to));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [items, search, statusFilter, fromDate, toDate]);

  const availableTotal = useMemo(() => {
    return filteredCredits.reduce((sum, item) => {
      if (item.status === "used" || item.status === "expired") return sum;
      return sum + Number(item.amount || 0);
    }, 0);
  }, [filteredCredits]);

  const openCount = useMemo(() => {
    return filteredCredits.filter(
      (item) => item.status === "available" || item.status === "partially_used"
    ).length;
  }, [filteredCredits]);

  const expiringSoonCount = useMemo(() => {
    return filteredCredits.filter(
      (item) =>
        (item.status === "available" || item.status === "partially_used") &&
        isDateWithinDays(item.expiry_date, 14) &&
        !isPastDate(item.expiry_date)
    ).length;
  }, [filteredCredits]);

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const previousItems = items;
    setDeleting(true);
    setMessage("");
    setItems((current) => current.filter((item) => item.id !== deleteId));

    const { error } = await supabase.from("credits").delete().eq("id", deleteId);

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

  const toggleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasAdvancedFilters =
    statusFilter !== "all" || fromDate.length > 0 || toDate.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                ניהול זיכויים והחזרים
              </p>
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

        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">חיפוש ופילטרים</p>
                <p className="text-xs text-slate-500">
                  חפש לפי חברה, סיבה, אופן מימוש או פרטי קשר
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                showFilters || hasAdvancedFilters
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Filter size={18} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש זיכוי..."
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300"
            />
          </div>

          {showFilters && (
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">
                  פילטרים מתקדמים
                </p>

                {hasAdvancedFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
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
                  { value: "available", label: "זמין" },
                  { value: "partially_used", label: "נוצל חלקית" },
                  { value: "used", label: "נוצל" },
                  { value: "expired", label: "פג תוקף" },
                ].map((option) => {
                  const isActive = statusFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value as StatusFilter)}
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
                טווח תאריכי תפוגה
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-300"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-300"
                  />
                </div>
              </div>
            </div>
          )}
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
                <p className="mt-1 text-sm text-slate-500">
                  נוסיף את הזיכוי שלך בכמה שניות
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
          לחץ על פרטים להצגת מידע · החלק ימינה לעריכה · שמאלה למחיקה
        </p>

        <div className="space-y-3">
          {filteredCredits.length ? (
            filteredCredits.map((item) => {
              const expiringSoon = isDateWithinDays(item.expiry_date, 14);
              const isExpired = isPastDate(item.expiry_date);
              const amount = Number(item.amount || 0);
              const isOpen = openId === item.id;

              return (
                <SwipeableFinanceRow
                  key={item.id}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => requestDelete(item.id)}
                >
                  <div className="overflow-hidden rounded-[2rem] bg-white">
                    <div className="p-4">
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

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOpen(item.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                            >
                              {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              פרטים
                            </button>
                          </>
                        }
                      />
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 text-sm text-slate-700">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <span className="font-semibold text-slate-900">שם החברה: </span>
                              {item.company || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">סכום הזיכוי: </span>
                              {formatCurrency(amount, item.currency)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">מטבע: </span>
                              {item.currency || "ILS"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">תאריך קבלה: </span>
                              {formatDate(item.received_date)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">תאריך תפוגה: </span>
                              {formatDate(item.expiry_date)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">סטטוס: </span>
                              {getStatusLabel(item.status)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">סיבת הזיכוי: </span>
                              {item.reason || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">איך מממשים: </span>
                              {item.redeem_method || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">פרטי מימוש: </span>
                              {item.contact_info || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">הערות: </span>
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
              לא נמצאו זיכויים לפי הסינון שבחרת
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