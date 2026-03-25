"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowRight } from "lucide-react";
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
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <button
          type="button"
          onClick={() => router.push("/subscriptions")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ArrowRight size={16} />
          חזרה למנויים
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">עריכת מנוי</h1>
          <p className="mt-1 text-sm text-slate-500">עדכון פרטי המנוי</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  שם המנוי
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: נטפליקס"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  ספק
                </label>
                <input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="למשל: Netflix"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    מחיר
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    מטבע
                  </label>
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="ILS"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  תאריך חידוש
                </label>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/subscriptions")}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              ביטול
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              <Save size={16} />
              {loading ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
            {message}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}