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
        <button type="button" className="rounded-2xl border border-slate-200 p-3 text-sm">
          קוד
        </button>
        <button type="button" className="rounded-2xl border border-slate-200 p-3 text-sm">
          קישור
        </button>
        <button type="button" className="rounded-2xl border border-slate-200 p-3 text-sm">
          קובץ / תמונה
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="שם השובר"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="מותג / חנות"
          value={form.company}
          onChange={(e) => updateField("company", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="ערך (₪)"
          value={form.value}
          onChange={(e) => updateField("value", e.target.value)}
          required
        />
        <input
          className="input"
          type="date"
          value={form.expiry_date}
          onChange={(e) => updateField("expiry_date", e.target.value)}
        />
      </div>

      <input
        className="input"
        placeholder="קוד שובר"
        value={form.voucher_code}
        onChange={(e) => updateField("voucher_code", e.target.value)}
      />

      <input
        className="input"
        placeholder="איפה אפשר לממש"
        value={form.redeem_where}
        onChange={(e) => updateField("redeem_where", e.target.value)}
      />

      <input
        className="input"
        placeholder="אפליקציה / אתר למימוש"
        value={form.redemption_platform}
        onChange={(e) => updateField("redemption_platform", e.target.value)}
      />

      <input
        className="input"
        placeholder="קישור ישיר למימוש"
        value={form.redemption_url}
        onChange={(e) => updateField("redemption_url", e.target.value)}
      />

      <select
        className="input"
        value={form.status}
        onChange={(e) => updateField("status", e.target.value)}
      >
        <option value="active">פעיל</option>
        <option value="partially_used">מומש חלקית</option>
        <option value="used">מומש</option>
        <option value="expired">פג תוקף</option>
      </select>

      <textarea
        className="input min-h-24"
        placeholder="תנאים / הערות"
        value={form.notes}
        onChange={(e) => updateField("notes", e.target.value)}
      />

      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}