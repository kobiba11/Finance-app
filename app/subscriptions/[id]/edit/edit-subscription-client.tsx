"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowRight,
  RefreshCcw,
  CalendarDays,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../../components/bottom-nav";

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
  subscription: SubscriptionItem;
};

export default function EditSubscriptionClient({ subscription }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(subscription.name || "");
  const [provider, setProvider] = useState(subscription.provider || "");
  const [price, setPrice] = useState(String(subscription.price ?? ""));
  const [currency, setCurrency] = useState(subscription.currency || "ILS");
  const [billingFrequency, setBillingFrequency] = useState<
    "monthly" | "yearly"
  >(subscription.billing_frequency || "monthly");
  const [renewalDate, setRenewalDate] = useState(subscription.renewal_date || "");
  const [status, setStatus] = useState(subscription.status || "active");

  const [joinDate, setJoinDate] = useState(subscription.join_date || "");
  const [hasCommitment, setHasCommitment] = useState(
    Boolean(subscription.has_commitment)
  );
  const [commitmentEndDate, setCommitmentEndDate] = useState(
    subscription.commitment_end_date || ""
  );
  const [hasPriceIncrease, setHasPriceIncrease] = useState(
    Boolean(subscription.has_price_increase)
  );
  const [newPrice, setNewPrice] = useState(
    subscription.new_price != null ? String(subscription.new_price) : ""
  );
  const [priceIncreaseDate, setPriceIncreaseDate] = useState(
    subscription.price_increase_date || ""
  );
  const [managementUrl, setManagementUrl] = useState(
    subscription.management_url || ""
  );
  const [notes, setNotes] = useState(subscription.notes || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("subscriptions")
      .update({
        name,
        provider: provider || null,
        price: price ? Number(price) : null,
        currency,
        billing_frequency: billingFrequency,
        renewal_date: renewalDate || null,
        status,
        join_date: joinDate || null,
        has_commitment: hasCommitment,
        commitment_end_date: hasCommitment ? commitmentEndDate || null : null,
        has_price_increase: hasPriceIncrease,
        new_price: hasPriceIncrease ? (newPrice ? Number(newPrice) : null) : null,
        price_increase_date: hasPriceIncrease ? priceIncreaseDate || null : null,
        management_url: managementUrl || null,
        notes: notes || null,
      })
      .eq("id", subscription.id);

    setLoading(false);

    if (error) {
      setMessage("שגיאה בשמירת המנוי.");
      return;
    }

    router.push("/subscriptions");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-300 via-cyan-400 to-teal-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/subscriptions")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowRight size={18} />
            </button>

            <div className="min-w-0 text-right">
              <p className="text-xs font-medium text-slate-500">עדכון פרטי מנוי</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">עריכת מנוי</h1>
              <p className="mt-1 text-sm text-slate-500">
                עדכן את הפרטים ושמור חזרה לרשימה
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-900">פרטים בסיסיים</h2>
              <p className="mt-1 text-xs text-slate-500">
                עדכון מהיר של הנתונים החשובים
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  שם מנוי
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <RefreshCcw size={16} className="text-teal-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="למשל: Netflix"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  חברה / שירות
                </label>
                <input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="למשל: Spotify"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  מחיר
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <CreditCard size={16} className="text-teal-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="ILS">₪</option>
                    <option value="USD">$</option>
                    <option value="EUR">€</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  תדירות
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingFrequency("monthly")}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      billingFrequency === "monthly"
                        ? "bg-teal-500 text-white shadow-[0_12px_30px_rgba(20,184,166,0.25)]"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    חודשי
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingFrequency("yearly")}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      billingFrequency === "yearly"
                        ? "bg-teal-500 text-white shadow-[0_12px_30px_rgba(20,184,166,0.25)]"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    שנתי
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-2 block text-sm font-medium text-slate-600">
                תאריך חיוב הבא
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <CalendarDays size={16} className="text-teal-500" />
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex w-full items-center justify-between px-4 py-4 text-right"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">אפשרויות נוספות</p>
                <p className="mt-1 text-xs text-slate-500">
                  סטטוס, התחייבות, שינוי מחיר, קישור והערות
                </p>
              </div>

              <div className="text-slate-500">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-1">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    תאריך הצטרפות
                  </label>
                  <input
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    סטטוס
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                  >
                    <option value="active">פעיל</option>
                    <option value="paused">מושהה</option>
                    <option value="cancelled">בוטל</option>
                    <option value="expired">פג</option>
                    <option value="ending_soon">עומד להסתיים</option>
                  </select>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasCommitment}
                      onChange={(e) => setHasCommitment(e.target.checked)}
                    />
                    יש תקופת התחייבות
                  </label>

                  {hasCommitment && (
                    <div className="mt-3">
                      <label className="mb-2 block text-sm font-medium text-slate-600">
                        תאריך סיום התחייבות
                      </label>
                      <input
                        type="date"
                        value={commitmentEndDate}
                        onChange={(e) => setCommitmentEndDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasPriceIncrease}
                      onChange={(e) => setHasPriceIncrease(e.target.checked)}
                    />
                    יש שינוי מחיר צפוי
                  </label>

                  {hasPriceIncrease && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">
                          מחיר חדש
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="מחיר חדש"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-600">
                          מתאריך
                        </label>
                        <input
                          type="date"
                          value={priceIncreaseDate}
                          onChange={(e) => setPriceIncreaseDate(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    קישור לניהול המנוי
                  </label>
                  <div className="relative">
                    <LinkIcon
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={managementUrl}
                      onChange={(e) => setManagementUrl(e.target.value)}
                      placeholder="הדבק קישור לניהול / ביטול"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none transition focus:border-teal-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    הערות
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="הערות פנימיות על המנוי"
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,184,166,0.28)] disabled:opacity-60"
            >
              <Save size={16} />
              {loading ? "שומר..." : "שמור שינויים"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/subscriptions")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ביטול
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}