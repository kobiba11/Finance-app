"use client";

import { useState, useTransition } from "react";
import { createVoucher } from "app/actions/finance";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

export default function AddVoucherForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: "",
    company: "",
    value: "",
    currency: "ILS",
    redeem_where: "",
    redemption_platform: "",
    redemption_url: "",
    voucher_code: "",
    expiry_date: "",
    notes: "",
    image_url: "",
    status: "active",
  });

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await createVoucher({
        household_id: householdId,
        name: form.name,
        company: form.company || undefined,
        value: Number(form.value || 0),
        currency: form.currency,
        redeem_where: form.redeem_where || undefined,
        redemption_platform: form.redemption_platform || undefined,
        redemption_url: form.redemption_url || undefined,
        voucher_code: form.voucher_code || undefined,
        expiry_date: form.expiry_date || undefined,
        notes: form.notes || undefined,
        image_url: form.image_url || undefined,
        status: form.status as "active" | "partially_used" | "used" | "expired",
      });

      setForm({
        name: "",
        company: "",
        value: "",
        currency: "ILS",
        redeem_where: "",
        redemption_platform: "",
        redemption_url: "",
        voucher_code: "",
        expiry_date: "",
        notes: "",
        image_url: "",
        status: "active",
      });

      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3 text-sm font-medium text-teal-700"
        >
          קוד
        </button>
        <button
          type="button"
          className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-sm font-medium text-cyan-700"
        >
          קישור
        </button>
        <button
          type="button"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700"
        >
          קובץ / תמונה
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            שם השובר
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="שם השובר"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            מותג / חנות
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="מותג / חנות"
            value={form.company}
            onChange={(e) => updateField("company", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            ערך
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            type="number"
            step="0.01"
            placeholder="ערך (₪)"
            value={form.value}
            onChange={(e) => updateField("value", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            תאריך תפוגה
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            type="date"
            value={form.expiry_date}
            onChange={(e) => updateField("expiry_date", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          מטבע
        </label>
        <select
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          value={form.currency}
          onChange={(e) => updateField("currency", e.target.value)}
        >
          <option value="ILS">₪ ILS</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          קוד שובר
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="קוד שובר"
          value={form.voucher_code}
          onChange={(e) => updateField("voucher_code", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          איפה אפשר לממש
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="איפה אפשר לממש"
          value={form.redeem_where}
          onChange={(e) => updateField("redeem_where", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          אפליקציה / אתר למימוש
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="אפליקציה / אתר למימוש"
          value={form.redemption_platform}
          onChange={(e) => updateField("redemption_platform", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          קישור ישיר למימוש
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="קישור ישיר למימוש"
          value={form.redemption_url}
          onChange={(e) => updateField("redemption_url", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          סטטוס
        </label>
        <select
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          value={form.status}
          onChange={(e) => updateField("status", e.target.value)}
        >
          <option value="active">פעיל</option>
          <option value="partially_used">מומש חלקית</option>
          <option value="used">מומש</option>
          <option value="expired">פג תוקף</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          תנאים / הערות
        </label>
        <textarea
          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="תנאים / הערות"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,184,166,0.28)] disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}