"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../../components/bottom-nav";

type VoucherItem = {
  id: string;
  household_id?: string | null;
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
  voucher: VoucherItem;
};

function formatDateForInput(date?: string | null) {
  if (!date) return "";
  return date.slice(0, 10);
}

export default function EditVoucherClient({ voucher }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(voucher.name || "");
  const [company, setCompany] = useState(voucher.company || "");
  const [value, setValue] = useState(
    voucher.value !== null && voucher.value !== undefined
      ? String(voucher.value)
      : ""
  );
  const [currency, setCurrency] = useState(voucher.currency || "ILS");
  const [redeemWhere, setRedeemWhere] = useState(voucher.redeem_where || "");
  const [redemptionPlatform, setRedemptionPlatform] = useState(
    voucher.redemption_platform || ""
  );
  const [redemptionUrl, setRedemptionUrl] = useState(
    voucher.redemption_url || ""
  );
  const [voucherCode, setVoucherCode] = useState(voucher.voucher_code || "");
  const [expiryDate, setExpiryDate] = useState(
    formatDateForInput(voucher.expiry_date)
  );
  const [status, setStatus] = useState(voucher.status || "available");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        name: name.trim(),
        company: company.trim() || null,
        value: value === "" ? null : Number(value),
        currency: currency.trim() || "ILS",
        redeem_where: redeemWhere.trim() || null,
        redemption_platform: redemptionPlatform.trim() || null,
        redemption_url: redemptionUrl.trim() || null,
        voucher_code: voucherCode.trim() || null,
        expiry_date: expiryDate || null,
        status,
      };

      let query = supabase.from("vouchers").update(payload).eq("id", voucher.id);

      if (voucher.household_id) {
        query = query.eq("household_id", voucher.household_id);
      }

      const { error } = await query;

      if (error) {
        console.error("Update voucher error:", error);
        setMessage(`שגיאה בשמירת השובר: ${error.message}`);
        return;
      }

      window.location.href = "/vouchers";
    } catch (err) {
      console.error("Unexpected update error:", err);
      setMessage("אירעה שגיאה לא צפויה בשמירת השובר.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <button
          type="button"
          onClick={() => router.push("/vouchers")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ArrowRight size={16} />
          חזרה לשוברים
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">עריכת שובר</h1>
          <p className="mt-1 text-sm text-slate-500">עדכון פרטי השובר</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  שם השובר
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: שובר BUYME"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  חברה
                </label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="למשל: FOX"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    שווי
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  איפה מממשים
                </label>
                <input
                  value={redeemWhere}
                  onChange={(e) => setRedeemWhere(e.target.value)}
                  placeholder="למשל: אתר / סניף / אפליקציה"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  פלטפורמת מימוש
                </label>
                <input
                  value={redemptionPlatform}
                  onChange={(e) => setRedemptionPlatform(e.target.value)}
                  placeholder="למשל: BUYME"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  קישור למימוש
                </label>
                <input
                  value={redemptionUrl}
                  onChange={(e) => setRedemptionUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  קוד שובר
                </label>
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="קוד / מספר שובר"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    סטטוס
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="available">פעיל</option>
                    <option value="used">נוצל</option>
                    <option value="expired">פג תוקף</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/vouchers")}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              ביטול
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
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