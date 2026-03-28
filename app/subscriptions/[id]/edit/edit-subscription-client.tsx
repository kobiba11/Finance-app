"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowRight,
  RefreshCcw,
  CalendarDays,
  CreditCard,
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
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              <ArrowRight size={18} />
            </button>

            <div className="min-w-0 text-right">
              <p className="text-xs font-medium text-slate-500">עדכון פרטי מנוי</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">עריכת מנוי</h1>
              <p className="mt-1 text-sm text-slate-500">
                שנה פרטים ושמור בחזרה לרשימה
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              שם המנוי
            </label>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <RefreshCcw size={18} className="text-teal-500" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: נטפליקס"
                  className="w-full bg-transparent text-base text-slate-800 outline-none"
                  required
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-500">
                  ספק
                </label>
                <input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="למשל: Netflix"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-500">
                    מחיר
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <CreditCard size={16} className="text-teal-500" />
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-500">
                    מטבע
                  </label>
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="ILS"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-500">
                    תדירות חיוב
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) =>
                      setBillingFrequency(e.target.value as "monthly" | "yearly")
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="monthly">חודשי</option>
                    <option value="yearly">שנתי</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-500">
                    סטטוס
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="active">פעיל</option>
                    <option value="paused">מושהה</option>
                    <option value="cancelled">בוטל</option>
                    <option value="expired">פג</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-500">
                  תאריך חידוש
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
            </div>
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
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700"
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