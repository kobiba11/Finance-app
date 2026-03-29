"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Sparkles,
  Wand2,
} from "lucide-react";
import { createSubscription } from "app/actions/finance";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

type ParsedSubscription = {
  name?: string;
  provider?: string;
  price?: string;
  billing_frequency?: "monthly" | "yearly";
};

const KNOWN_SERVICES = [
  "Netflix",
  "Spotify",
  "YouTube Premium",
  "Apple Music",
  "iCloud",
  "Google One",
  "Disney+",
  "Cellcom TV",
  "Partner TV",
  "Amazon Prime",
  "ChatGPT Plus",
  "clalit",
  "מכבי",
  "לאומית",
  "מאוחדת",
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseSubscriptionText(text: string): ParsedSubscription {
  const normalized = cleanText(text);
  const lower = normalized.toLowerCase();

  if (!normalized) return {};

  const detectedService = KNOWN_SERVICES.find((service) =>
    lower.includes(service.toLowerCase())
  );

  const priceMatch = normalized.match(/(\d+(?:[.,]\d{1,2})?)/);
  const rawPrice = priceMatch ? priceMatch[1].replace(",", ".") : "";

  let billing_frequency: "monthly" | "yearly" = "monthly";

  if (
    lower.includes("שנתי") ||
    lower.includes("לשנה") ||
    lower.includes("per year") ||
    lower.includes("yearly") ||
    lower.includes("annual")
  ) {
    billing_frequency = "yearly";
  }

  if (
    lower.includes("חודשי") ||
    lower.includes("לחודש") ||
    lower.includes("monthly") ||
    lower.includes("per month")
  ) {
    billing_frequency = "monthly";
  }

  let name = detectedService || "";
  let provider = detectedService || "";

  if (!detectedService) {
    const withoutPrice = normalized.replace(/(\d+(?:[.,]\d{1,2})?)/, "").trim();
    const withoutFrequency = withoutPrice
      .replace(/חודשי|שנתי|monthly|yearly|per month|per year|annual/gi, "")
      .trim();

    const parts = withoutFrequency
      .split(/[-,]/)
      .map((part) => cleanText(part))
      .filter(Boolean);

    if (parts.length >= 2) {
      name = parts[0];
      provider = parts[1];
    } else if (parts.length === 1) {
      const single = parts[0];
      const words = single.split(" ").filter(Boolean);

      if (words.length >= 2) {
        name = words.slice(0, 2).join(" ");
        provider = single;
      } else {
        name = single;
        provider = single;
      }
    }
  }

  return {
    name,
    provider,
    price: rawPrice,
    billing_frequency,
  };
}

export default function AddSubscriptionForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickText, setQuickText] = useState("");

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

  function applyQuickFill() {
    const parsed = parseSubscriptionText(quickText);

    setForm((prev) => ({
      ...prev,
      name: parsed.name || prev.name,
      provider: parsed.provider || prev.provider,
      price: parsed.price || prev.price,
      billing_frequency: parsed.billing_frequency || prev.billing_frequency,
    }));
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
        commitment_end_date: form.has_commitment
          ? form.commitment_end_date || undefined
          : undefined,
        has_price_increase: form.has_price_increase,
        new_price: form.has_price_increase ? Number(form.new_price || 0) : null,
        price_increase_date: form.has_price_increase
          ? form.price_increase_date || undefined
          : undefined,
        management_url: form.management_url || undefined,
        notes: form.notes || undefined,
        status: form.status as "active" | "ending_soon" | "cancelled",
      });

      onSuccess?.();
    });
  }

  const canApplyQuickFill = useMemo(
    () => quickText.trim().length > 0,
    [quickText]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-[1.75rem] border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">הוספה חכמה</h3>
            <p className="text-xs text-slate-500">
              הדבק טקסט כמו: Netflix 39.90 חודשי
            </p>
          </div>
        </div>

        <textarea
          className="min-h-24 w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
          placeholder="למשל: Spotify 21.90 חודשי"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
        />

        <button
          type="button"
          onClick={applyQuickFill}
          disabled={!canApplyQuickFill}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Wand2 size={16} />
          מלא אוטומטית מהטקסט
        </button>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">פרטים בסיסיים</h3>
          <p className="mt-1 text-xs text-slate-500">
            רק מה שצריך כדי לשמור מהר
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              שם מנוי
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
              placeholder="למשל: Netflix"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              חברה / שירות
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
              placeholder="למשל: Spotify"
              value={form.provider}
              onChange={(e) => updateField("provider", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              מחיר
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <input
                className="w-full bg-transparent text-sm outline-none"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                required
              />
              <select
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
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
                onClick={() => updateField("billing_frequency", "monthly")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  form.billing_frequency === "monthly"
                    ? "bg-teal-500 text-white shadow-[0_12px_30px_rgba(20,184,166,0.25)]"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                חודשי
              </button>

              <button
                type="button"
                onClick={() => updateField("billing_frequency", "yearly")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  form.billing_frequency === "yearly"
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
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
            type="date"
            value={form.renewal_date}
            onChange={(e) => updateField("renewal_date", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-4 text-right"
        >
          <div>
            <p className="text-sm font-bold text-slate-900">אפשרויות נוספות</p>
            <p className="mt-1 text-xs text-slate-500">
              קישור לניהול, התחייבות, שינוי מחיר, הערות ועוד
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                type="date"
                value={form.join_date}
                onChange={(e) => updateField("join_date", e.target.value)}
              />
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.has_commitment}
                  onChange={(e) => updateField("has_commitment", e.target.checked)}
                />
                יש תקופת התחייבות
              </label>

              {form.has_commitment && (
                <div className="mt-3">
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    תאריך סיום התחייבות
                  </label>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                    type="date"
                    value={form.commitment_end_date}
                    onChange={(e) =>
                      updateField("commitment_end_date", e.target.value)
                    }
                  />
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.has_price_increase}
                  onChange={(e) =>
                    updateField("has_price_increase", e.target.checked)
                  }
                />
                יש שינוי מחיר צפוי
              </label>

              {form.has_price_increase && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      מחיר חדש
                    </label>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                      type="number"
                      step="0.01"
                      placeholder="מחיר חדש"
                      value={form.new_price}
                      onChange={(e) => updateField("new_price", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      מתאריך
                    </label>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                      type="date"
                      value={form.price_increase_date}
                      onChange={(e) =>
                        updateField("price_increase_date", e.target.value)
                      }
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none transition focus:border-teal-300"
                  placeholder="הדבק קישור לניהול / ביטול"
                  value={form.management_url}
                  onChange={(e) => updateField("management_url", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                סטטוס
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="active">פעיל</option>
                <option value="ending_soon">עומד להסתיים</option>
                <option value="cancelled">בוטל</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                הערות
              </label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-300"
                placeholder="הערות פנימיות על המנוי"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,184,166,0.28)] disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "שומר..." : "שמור מנוי"}
      </button>
    </form>
  );
}