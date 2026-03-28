"use client";

import { useState, useTransition } from "react";
import { createCredit } from "app/actions/finance";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

export default function AddCreditForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    company: "",
    amount: "",
    currency: "ILS",
    received_date: "",
    expiry_date: "",
    reason: "",
    redeem_method: "",
    contact_info: "",
    notes: "",
    status: "available",
  });

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await createCredit({
        household_id: householdId,
        company: form.company,
        amount: Number(form.amount || 0),
        currency: form.currency,
        received_date: form.received_date || undefined,
        expiry_date: form.expiry_date || undefined,
        reason: form.reason || undefined,
        redeem_method: form.redeem_method || undefined,
        contact_info: form.contact_info || undefined,
        notes: form.notes || undefined,
        status: form.status as "available" | "partially_used" | "used" | "expired",
      });

      setForm({
        company: "",
        amount: "",
        currency: "ILS",
        received_date: "",
        expiry_date: "",
        reason: "",
        redeem_method: "",
        contact_info: "",
        notes: "",
        status: "available",
      });

      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            שם החברה
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="שם החברה"
            value={form.company}
            onChange={(e) => updateField("company", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            סכום הזיכוי
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            type="number"
            step="0.01"
            placeholder="סכום הזיכוי"
            value={form.amount}
            onChange={(e) => updateField("amount", e.target.value)}
            required
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            תאריך קבלה
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            type="date"
            value={form.received_date}
            onChange={(e) => updateField("received_date", e.target.value)}
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
          על מה הזיכוי התקבל
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="על מה הזיכוי התקבל"
          value={form.reason}
          onChange={(e) => updateField("reason", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          איך אפשר לממש
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="איך אפשר לממש"
          value={form.redeem_method}
          onChange={(e) => updateField("redeem_method", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          קישור / טלפון / הערה
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="קישור / טלפון / הערה"
          value={form.contact_info}
          onChange={(e) => updateField("contact_info", e.target.value)}
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
          <option value="available">זמין</option>
          <option value="partially_used">נוצל חלקית</option>
          <option value="used">נוצל</option>
          <option value="expired">פג תוקף</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          הערות
        </label>
        <textarea
          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          placeholder="הערות"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.28)] disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}