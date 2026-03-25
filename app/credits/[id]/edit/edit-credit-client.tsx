"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../../components/bottom-nav";

type CreditItem = {
  id: string;
  household_id?: string | null;
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
  credit: CreditItem;
};

function formatDateForInput(date?: string | null) {
  if (!date) return "";
  return date.slice(0, 10);
}

export default function EditCreditClient({ credit }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [company, setCompany] = useState(credit.company || "");
  const [amount, setAmount] = useState(
    credit.amount !== null && credit.amount !== undefined
      ? String(credit.amount)
      : ""
  );
  const [currency, setCurrency] = useState(credit.currency || "ILS");
  const [receivedDate, setReceivedDate] = useState(
    formatDateForInput(credit.received_date)
  );
  const [expiryDate, setExpiryDate] = useState(
    formatDateForInput(credit.expiry_date)
  );
  const [reason, setReason] = useState(credit.reason || "");
  const [redeemMethod, setRedeemMethod] = useState(credit.redeem_method || "");
  const [contactInfo, setContactInfo] = useState(credit.contact_info || "");
  const [status, setStatus] = useState(credit.status || "available");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        company: company.trim(),
        amount: amount === "" ? null : Number(amount),
        currency: currency.trim() || "ILS",
        received_date: receivedDate || null,
        expiry_date: expiryDate || null,
        reason: reason.trim() || null,
        redeem_method: redeemMethod.trim() || null,
        contact_info: contactInfo.trim() || null,
        status,
      };

      let query = supabase.from("credits").update(payload).eq("id", credit.id);

      if (credit.household_id) {
        query = query.eq("household_id", credit.household_id);
      }

      const { error } = await query;

      if (error) {
        console.error("Update credit error:", error);
        setMessage(`שגיאה בשמירת הזיכוי: ${error.message}`);
        return;
      }

      window.location.href = "/credits";
    } catch (err) {
      console.error("Unexpected update error:", err);
      setMessage("אירעה שגיאה לא צפויה בשמירת הזיכוי.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <button
          type="button"
          onClick={() => router.push("/credits")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ArrowRight size={16} />
          חזרה לזיכויים
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">עריכת זיכוי</h1>
          <p className="mt-1 text-sm text-slate-500">עדכון פרטי הזיכוי</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  חברה
                </label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="למשל: שופרסל"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  סיבה
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="למשל: בקבוקים"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    סכום
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                    תאריך קבלה
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    תאריך תפוגה
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  אופן מימוש
                </label>
                <input
                  value={redeemMethod}
                  onChange={(e) => setRedeemMethod(e.target.value)}
                  placeholder="למשל: שובר בקופה"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  פרטי קשר
                </label>
                <input
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="טלפון / מייל / אתר"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
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
                  <option value="available">זמין</option>
                  <option value="partially_used">נוצל חלקית</option>
                  <option value="used">נוצל</option>
                  <option value="expired">פג תוקף</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/credits")}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              ביטול
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
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