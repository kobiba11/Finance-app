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
        <input
          className="input"
          placeholder="שם החברה"
          value={form.company}
          onChange={(e) => updateField("company", e.target.value)}
          required
        />
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="סכום הזיכוי"
          value={form.amount}
          onChange={(e) => updateField("amount", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          type="date"
          value={form.received_date}
          onChange={(e) => updateField("received_date", e.target.value)}
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
        placeholder="על מה הזיכוי התקבל"
        value={form.reason}
        onChange={(e) => updateField("reason", e.target.value)}
      />

      <input
        className="input"
        placeholder="איך אפשר לממש"
        value={form.redeem_method}
        onChange={(e) => updateField("redeem_method", e.target.value)}
      />

      <input
        className="input"
        placeholder="קישור / טלפון / הערה"
        value={form.contact_info}
        onChange={(e) => updateField("contact_info", e.target.value)}
      />

      <select
        className="input"
        value={form.status}
        onChange={(e) => updateField("status", e.target.value)}
      >
        <option value="available">זמין</option>
        <option value="partially_used">נוצל חלקית</option>
        <option value="used">נוצל</option>
        <option value="expired">פג תוקף</option>
      </select>

      <textarea
        className="input min-h-24"
        placeholder="הערות"
        value={form.notes}
        onChange={(e) => updateField("notes", e.target.value)}
      />

      <button type="submit" className="btn-primary w-full" disabled={isPending}>
        {isPending ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}