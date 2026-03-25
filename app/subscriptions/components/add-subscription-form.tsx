"use client";

import { useState, useTransition } from "react";
import { createSubscription } from "app/actions/finance";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

export default function AddSubscriptionForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: "",
    provider: "",
    price: "",
    currency: "ILS",
    billing_frequency: "monthly",
    join_date: "",
    renewal_date: "",
    has_commitment: false,
    commitment_end_date: "",
    has_price_increase: false,
    new_price: "",
    price_increase_date: "",
    management_url: "",
    notes: "",
    status: "active",
  });

  function updateField(name: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await createSubscription({
        household_id: householdId,
        name: form.name,
        provider: form.provider || undefined,
        price: Number(form.price || 0),
        currency: form.currency,
        billing_frequency: form.billing_frequency as "monthly" | "yearly",
        join_date: form.join_date || undefined,
        renewal_date: form.renewal_date || undefined,
        has_commitment: form.has_commitment,
        commitment_end_date: form.has_commitment ? form.commitment_end_date || undefined : undefined,
        has_price_increase: form.has_price_increase,
        new_price: form.has_price_increase ? Number(form.new_price || 0) : null,
        price_increase_date: form.has_price_increase ? form.price_increase_date || undefined : undefined,
        management_url: form.management_url || undefined,
        notes: form.notes || undefined,
        status: form.status as "active" | "ending_soon" | "cancelled",
      });

      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="שם מנוי"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="חברה / שירות"
          value={form.provider}
          onChange={(e) => updateField("provider", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="מחיר"
          value={form.price}
          onChange={(e) => updateField("price", e.target.value)}
          required
        />
        <select
          className="input"
          value={form.billing_frequency}
          onChange={(e) => updateField("billing_frequency", e.target.value)}
        >
          <option value="monthly">חודשי</option>
          <option value="yearly">שנתי</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          type="date"
          value={form.join_date}
          onChange={(e) => updateField("join_date", e.target.value)}
        />
        <input
          className="input"
          type="date"
          value={form.renewal_date}
          onChange={(e) => updateField("renewal_date", e.target.value)}
        />
      </div>

      <select
        className="input"
        value={form.currency}
        onChange={(e) => updateField("currency", e.target.value)}
      >
        <option value="ILS">₪ ILS</option>
        <option value="USD">$ USD</option>
        <option value="EUR">€ EUR</option>
      </select>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.has_commitment}
          onChange={(e) => updateField("has_commitment", e.target.checked)}
        />
        יש תקופת התחייבות
      </label>

      {form.has_commitment && (
        <input
          className="input"
          type="date"
          value={form.commitment_end_date}
          onChange={(e) => updateField("commitment_end_date", e.target.value)}
        />
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.has_price_increase}
          onChange={(e) => updateField("has_price_increase", e.target.checked)}
        />
        צפויה עליית מחיר
      </label>

      {form.has_price_increase && (
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="מחיר חדש"
            value={form.new_price}
            onChange={(e) => updateField("new_price", e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={form.price_increase_date}
            onChange={(e) => updateField("price_increase_date", e.target.value)}
          />
        </div>
      )}

      <input
        className="input"
        placeholder="קישור לניהול / ביטול"
        value={form.management_url}
        onChange={(e) => updateField("management_url", e.target.value)}
      />

      <select
        className="input"
        value={form.status}
        onChange={(e) => updateField("status", e.target.value)}
      >
        <option value="active">פעיל</option>
        <option value="ending_soon">עומד להסתיים</option>
        <option value="cancelled">בוטל</option>
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