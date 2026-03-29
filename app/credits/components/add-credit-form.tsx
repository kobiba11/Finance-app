"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Sparkles,
  Wand2,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { createCredit } from "app/actions/finance";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

type CreditStatus = "available" | "partially_used" | "used" | "expired";

type ParsedCreditData = {
  company: string;
  amount: string;
  currency: string;
  expiry_date: string;
  reason: string;
  rawText: string;
};

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanupRawText(text: string) {
  return text.replace(/[|]/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanValue(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function detectCurrency(text: string) {
  if (/₪|ש["״]?ח|שקל|שקלים|ILS/i.test(text)) return "ILS";
  if (/\$|USD|dollar/i.test(text)) return "USD";
  if (/€|EUR|euro/i.test(text)) return "EUR";
  return "ILS";
}

function tryMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function normalizeDateToISO(input: string) {
  const normalized = input.replace(/\./g, "/").replace(/-/g, "/").trim();

  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) {
    const [y, m, d] = normalized.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parts = normalized.split("/");
  if (parts.length !== 3) return "";

  let [d, m, y] = parts;
  if (y.length === 2) y = `20${y}`;

  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractDate(text: string) {
  const direct = tryMatch(text, [
    /(?:בתוקף עד|תוקף עד|valid until|expires on|expiry|expiration date|עד)[:\s-]*([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:20)?\d{2})/i,
    /(?:תאריך תפוגה|פג תוקף)[:\s-]*([0-3]?\d[\/.\-][0-1]?\d[\/.\-](?:20)?\d{2})/i,
  ]);

  if (direct) return normalizeDateToISO(direct);

  const generic = text.match(/\b([0-3]?\d[./-][0-1]?\d[./-](?:20)?\d{2})\b/);
  if (generic?.[1]) return normalizeDateToISO(generic[1]);

  return "";
}

function extractAmount(text: string) {
  const patterns = [
    /(?:זיכוי|credit|refund|amount|סכום|שווי|value|balance|יתרה)[:\s-]*([₪$€]?\s?\d+(?:[.,]\d{1,2})?)/i,
    /([₪$€]\s?\d+(?:[.,]\d{1,2})?)/,
    /(\d+(?:[.,]\d{1,2})?)\s?(?:₪|ש["״]?ח|ILS|USD|EUR|\$|€)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return cleanValue(match[1].replace(",", "."));
    }
  }

  return "";
}

function extractCompany(text: string) {
  const knownBrands = [
    "HOT",
    "YES",
    "Partner",
    "Cellcom",
    "שופרסל",
    "רמי לוי",
    "סופר-פארם",
    "סופר פארם",
    "MAX",
    "ויזה",
    "ישראכרט",
    "ביט",
    "פייבוקס",
    "Wolt",
    "Amazon",
    "FOX",
    "H&M",
    "ZARA",
    "Netflix",
    "Spotify",
    "clalit",
    "מכבי",
    "לאומית",
    "מאוחדת",
  ];

  for (const brand of knownBrands) {
    const regex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (regex.test(text)) return brand;
  }

  const match = tryMatch(text, [
    /(?:חברה|ספק|בית עסק|merchant|brand|company)[:\s-]*(.+)/i,
    /(?:מאת|עבור)[:\s-]*(.+)/i,
  ]);

  if (match) return match.split("\n")[0].trim();

  const firstUsefulLine = text
    .split("\n")
    .map((x) => x.trim())
    .find((x) => x.length > 1 && !/\d/.test(x.slice(0, 3)));

  return firstUsefulLine || "";
}

function extractReason(text: string) {
  const match = tryMatch(text, [
    /(?:סיבה|reason|for|עבור|בגין)[:\s-]*(.+)/i,
    /(?:פיצוי|החזר|זיכוי)[:\s-]*(.+)/i,
  ]);

  return match.split("\n")[0]?.trim() || "";
}

function parseCreditText(input: string): ParsedCreditData {
  const text = cleanupRawText(normalizeText(input));

  return {
    company: extractCompany(text),
    amount: extractAmount(text),
    currency: detectCurrency(text),
    expiry_date: extractDate(text),
    reason: extractReason(text),
    rawText: text,
  };
}

export default function AddCreditForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState("");

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
    status: "available" as CreditStatus,
  });

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateStatus(status: CreditStatus) {
    setForm((prev) => ({ ...prev, status }));
  }

  function applyParsedData(parsed: ParsedCreditData) {
    setForm((prev) => ({
      ...prev,
      company: parsed.company || prev.company,
      amount: parsed.amount || prev.amount,
      currency: parsed.currency || prev.currency,
      expiry_date: parsed.expiry_date || prev.expiry_date,
      reason: parsed.reason || prev.reason,
      notes:
        !prev.notes && parsed.rawText
          ? `טקסט שזוהה מהוספה חכמה:\n${parsed.rawText}`
          : prev.notes,
    }));
  }

  function applyQuickFill() {
    const parsed = parseCreditText(quickText);
    applyParsedData(parsed);
  }

  async function handleImageUpload(file: File) {
    setOcrLoading(true);
    setOcrMessage("");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng+heb");
      const result = await worker.recognize(file);
      await worker.terminate();

      const extractedText = result.data.text || "";
      if (!extractedText.trim()) {
        setOcrMessage("לא זוהה טקסט מהתמונה.");
        return;
      }

      const parsed = parseCreditText(extractedText);
      applyParsedData(parsed);
      setQuickText(extractedText);
      setOcrMessage("זיהינו פרטים מהתמונה ומילאנו את השדות.");
    } catch (error) {
      console.error("OCR credit image error:", error);
      setOcrMessage("לא הצלחנו לקרוא את התמונה. נסה צילום ברור יותר.");
    } finally {
      setOcrLoading(false);
    }
  }

  function resetForm() {
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
    setQuickText("");
    setShowAdvanced(false);
    setOcrMessage("");
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
        status: form.status,
      });

      resetForm();
      onSuccess?.();
    });
  }

  const canApplyQuickFill = useMemo(
    () => quickText.trim().length > 0,
    [quickText]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">הוספה חכמה</h3>
            <p className="text-xs text-slate-500">
              הדבק טקסט או העלה צילום מסך של זיכוי
            </p>
          </div>
        </div>

        <textarea
          className="min-h-24 w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
          placeholder="למשל: זיכוי HOT 120 ש״ח עד 31.12.2026"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={applyQuickFill}
            disabled={!canApplyQuickFill}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 size={16} />
            מלא מהטקסט
          </button>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">
            {ocrLoading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            העלה צילום מסך
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await handleImageUpload(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {ocrMessage && (
          <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-xs text-slate-600">
            {ocrMessage}
          </div>
        )}
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
              שם החברה
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
              placeholder="למשל: HOT"
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              סכום הזיכוי
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <input
                className="w-full bg-transparent text-sm outline-none"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => updateField("amount", e.target.value)}
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
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              תאריך תפוגה
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
              type="date"
              value={form.expiry_date}
              onChange={(e) => updateField("expiry_date", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              סטטוס
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStatus("available")}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  form.status === "available"
                    ? "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)]"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                זמין
              </button>

              <button
                type="button"
                onClick={() => updateStatus("partially_used")}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  form.status === "partially_used"
                    ? "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)]"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                חלקי
              </button>

              <button
                type="button"
                onClick={() => updateStatus("used")}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  form.status === "used"
                    ? "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)]"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                נוצל
              </button>

              <button
                type="button"
                onClick={() => updateStatus("expired")}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  form.status === "expired"
                    ? "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.25)]"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
              >
                פג
              </button>
            </div>
          </div>
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
              תאריך קבלה, סיבה, אופן מימוש, פרטי קשר והערות
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
                תאריך קבלה
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
                type="date"
                value={form.received_date}
                onChange={(e) => updateField("received_date", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                סיבת הזיכוי
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
                placeholder="למשל: פיצוי על תקלה"
                value={form.reason}
                onChange={(e) => updateField("reason", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                איך מממשים
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
                placeholder="למשל: דרך האפליקציה / מול נציג"
                value={form.redeem_method}
                onChange={(e) => updateField("redeem_method", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                פרטי מימוש
              </label>
              <div className="relative">
                <LinkIcon
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm outline-none transition focus:border-emerald-300"
                  placeholder="קישור, טלפון או הערה קצרה"
                  value={form.contact_info}
                  onChange={(e) => updateField("contact_info", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                הערות
              </label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300"
                placeholder="הערות פנימיות על הזיכוי"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.28)] disabled:opacity-60"
        disabled={isPending || ocrLoading}
      >
        {isPending ? "שומר..." : "שמור זיכוי"}
      </button>
    </form>
  );
}