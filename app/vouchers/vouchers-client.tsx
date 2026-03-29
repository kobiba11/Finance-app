"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Gift,
  Plus,
  X,
  TicketPercent,
  Clock3,
  Sparkles,
  Camera,
  Copy,
  Check,
  NotebookPen,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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
  image_url?: string | null;
  source_text?: string | null;
  notes?: string | null;
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
    case "active":
      return "פעיל";
    case "partially_used":
      return "מומש חלקית";
    case "used":
      return "מומש";
    case "expired":
      return "פג תוקף";
    default:
      return "פעיל";
  }
}

function getMonthValue(dateString?: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const monthNames = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  return `${monthNames[Number(month) - 1]} ${year}`;
}

export default function VouchersClient({ householdId, vouchers }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [items, setItems] = useState<VoucherItem[]>(vouchers);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState<"month" | "year" | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const toggleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    setItems(vouchers);
  }, [vouchers]);

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(items.map((item) => getMonthValue(item.expiry_date)).filter(Boolean))
    );
    return uniqueMonths.sort((a, b) => (a < b ? 1 : -1));
  }, [items]);

  useEffect(() => {
    if (!selectedMonth) {
      if (monthOptions.length > 0) {
        setSelectedMonth(monthOptions[0]);
      } else {
        setSelectedMonth(getMonthValue(new Date().toISOString()));
      }
    }
  }, [monthOptions, selectedMonth]);

  const filteredVouchers = useMemo(() => {
    let data = [...items];
    const now = new Date();

    if (period === "month" && selectedMonth) {
      data = data.filter(
        (item) => getMonthValue(item.expiry_date) === selectedMonth
      );
    }

    if (period === "year") {
      data = data.filter((item) => {
        if (!item.expiry_date) return false;
        const d = new Date(item.expiry_date);
        return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear();
      });
    }

    if (search.trim()) {
      const value = search.trim().toLowerCase();
      data = data.filter((item) => {
        const name = item.name?.toLowerCase() || "";
        const company = item.company?.toLowerCase() || "";
        const code = item.voucher_code?.toLowerCase() || "";
        return (
          name.includes(value) ||
          company.includes(value) ||
          code.includes(value)
        );
      });
    }

    if (selectedStatus) {
      data = data.filter((item) => (item.status || "active") === selectedStatus);
    }

    if (fromDate) {
      data = data.filter(
        (item) => item.expiry_date && item.expiry_date >= fromDate
      );
    }

    if (toDate) {
      data = data.filter(
        (item) => item.expiry_date && item.expiry_date <= toDate
      );
    }

    return data;
  }, [items, period, selectedMonth, search, selectedStatus, fromDate, toDate]);

  const activeTotal = useMemo(() => {
    return filteredVouchers.reduce((sum, item) => {
      if (item.status === "used" || item.status === "expired") return sum;
      return sum + Number(item.value || 0);
    }, 0);
  }, [filteredVouchers]);

  const expiringSoonCount = useMemo(() => {
    return filteredVouchers.filter((item) => {
      if (!item.expiry_date) return false;
      if (item.status === "used" || item.status === "expired") return false;
      return isDateWithinDays(item.expiry_date, 14);
    }).length;
  }, [filteredVouchers]);

  const totalCount = useMemo(() => filteredVouchers.length, [filteredVouchers]);

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const previousItems = items;
    setDeleting(true);
    setMessage("");
    setItems((current) => current.filter((item) => item.id !== deleteId));

    const { error } = await supabase.from("vouchers").delete().eq("id", deleteId);

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

  const handleCopyCode = async (itemId: string, code?: string | null) => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (error) {
      console.error("Copy voucher code error:", error);
      setMessage("לא הצלחנו להעתיק את קוד השובר.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setFromDate("");
    setToDate("");
    setPeriod("all");
    if (monthOptions.length > 0) {
      setSelectedMonth(monthOptions[0]);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-300 via-cyan-400 to-teal-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">ניהול שוברים וקופונים</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">שוברים</h1>
              <p className="mt-1 text-sm text-slate-500">
                מעקב אחרי שוברים, קופונים ותוקף
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              <Plus size={18} />
              הוסף
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                showFilters
                  ? "bg-teal-500 text-white"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>

            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש לפי שם שובר, חברה, קוד..."
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                period === "all"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              הכל
            </button>

            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                period === "month"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              חודש
            </button>

            <button
              type="button"
              onClick={() => setPeriod("year")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                period === "year"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              שנה
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setPeriod("month");
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                >
                  {monthOptions.length ? (
                    monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {getMonthLabel(month)}
                      </option>
                    ))
                  ) : (
                    <option value="">אין חודשים</option>
                  )}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="">כל הסטטוסים</option>
                  <option value="active">פעיל</option>
                  <option value="partially_used">מומש חלקית</option>
                  <option value="used">מומש</option>
                  <option value="expired">פג תוקף</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-red-500"
                >
                  נקה
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="flex items-center gap-1 text-sm text-slate-500"
                >
                  <X size={14} />
                  סגור
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
              <TicketPercent size={18} />
            </div>
            <p className="text-xl font-bold text-teal-600">{formatCurrency(activeTotal)}</p>
            <p className="mt-1 text-[10px] text-slate-500">שווי פעיל</p>
          </div>

          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
              <Clock3 size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{expiringSoonCount}</p>
            <p className="mt-1 text-[10px] text-slate-500">פגים בקרוב</p>
          </div>

          <div className="rounded-[1.7rem] border border-white/35 bg-white/92 p-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Gift size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
            <p className="mt-1 text-[10px] text-slate-500">סה״כ שוברים</p>
          </div>
        </section>

        {isAddOpen && (
          <section className="mb-5 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">הוספת שובר</h2>
                <p className="mt-1 text-sm text-slate-500">
                  אפשר לסרוק מתוך טקסט או להוסיף ידנית
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

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <Sparkles size={18} />
                </div>
                <p className="text-sm font-bold text-slate-900">סריקה חכמה</p>
                <p className="mt-1 text-xs text-slate-500">
                  הדבק טקסט או העלה צילום מסך ונמלא חלק מהשדות אוטומטית
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-cyan-200 bg-cyan-50 p-4">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                  <Camera size={18} />
                </div>
                <p className="text-sm font-bold text-slate-900">מוכן לתמונה</p>
                <p className="mt-1 text-xs text-slate-500">
                  העלאת תמונה וקישור ישיר לשובר
                </p>
              </div>
            </div>

            <AddVoucherForm
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
          {filteredVouchers.length ? (
            filteredVouchers.map((item) => {
              const hasCode = !!item.voucher_code?.trim();

              return (
                <div key={item.id} className="space-y-2">
                  <SwipeableFinanceRow
                    onEdit={() => handleEdit(item.id)}
                    onDelete={() => requestDelete(item.id)}
                  >
                    <div className="overflow-hidden rounded-[2rem] bg-white">
                      <div
                        onClick={() => toggleOpen(item.id)}
                        className="cursor-pointer"
                      >
                        <div className="p-4">
                          <FinanceItemRow
                            icon={<Gift size={20} />}
                            iconWrapperClassName="bg-teal-100 text-teal-600"
                            title={item.name}
                            subtitle={item.company || "ללא חברה"}
                            amount={formatCurrency(Number(item.value || 0), item.currency)}
                            amountClassName="text-teal-600"
                            meta={formatDate(item.expiry_date)}
                          />

                          {hasCode && (
                            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                              <span className="text-sm font-semibold tracking-wide text-slate-800">
                                {item.voucher_code}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(item.id, item.voucher_code);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check size={14} />
                                    הועתק
                                  </>
                                ) : (
                                  <>
                                    <Copy size={14} />
                                    העתק
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOpen(item.id);
                              }}
                              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                              {openId === item.id ? "הצג פחות ↑" : "הצג עוד ↓"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {openId === item.id && (
                        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 text-sm text-slate-700">
                          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {getStatusLabel(item.status)}
                              </span>

                              {isDateWithinDays(item.expiry_date, 14) &&
                                !isPastDate(item.expiry_date) && (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                                    פג בקרוב
                                  </span>
                                )}

                              {isPastDate(item.expiry_date) && (
                                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                                  פג תוקף
                                </span>
                              )}

                              {item.redemption_platform && (
                                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                                  {item.redemption_platform}
                                </span>
                              )}

                              {item.source_text && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                                  <Sparkles size={12} />
                                  זוהה אוטומטית
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">שם שובר: </span>
                              {item.name || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">חברה: </span>
                              {item.company || "—"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">שווי: </span>
                              {formatCurrency(Number(item.value || 0), item.currency)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">מטבע: </span>
                              {item.currency || "ILS"}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">תוקף: </span>
                              {formatDate(item.expiry_date)}
                            </div>

                            <div>
                              <span className="font-semibold text-slate-900">סטטוס: </span>
                              {getStatusLabel(item.status)}
                            </div>

                            {item.voucher_code && (
                              <div>
                                <span className="font-semibold text-slate-900">קוד: </span>
                                {item.voucher_code}
                              </div>
                            )}

                            {item.redeem_where && (
                              <div>
                                <span className="font-semibold text-slate-900">מימוש: </span>
                                {item.redeem_where}
                              </div>
                            )}

                            {item.redemption_platform && (
                              <div>
                                <span className="font-semibold text-slate-900">אפליקציה: </span>
                                {item.redemption_platform}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {item.redemption_url && (
                                <a
                                  href={item.redemption_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700"
                                >
                                  מעבר למימוש
                                </a>
                              )}

                              {item.image_url && (
                                <a
                                  href={item.image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                                >
                                  הצג שובר
                                </a>
                              )}
                            </div>

                            {item.notes && (
                              <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                  <NotebookPen size={14} />
                                  הערות
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                  {item.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </SwipeableFinanceRow>
                </div>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-white/35 bg-white/92 p-6 text-center text-sm text-slate-500 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              לא נמצאו שוברים לפי הסינון שבחרת
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