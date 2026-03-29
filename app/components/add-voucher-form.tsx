"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ScanText,
  PenSquare,
  ImagePlus,
  Link2,
  Ticket,
  Save,
  Sparkles,
  Gift,
  CalendarDays,
} from "lucide-react";
import { createVoucher } from "app/actions/finance";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

type FormState = {
  name: string;
  company: string;
  value: string;
  currency: string;
  redeem_where: string;
  redemption_platform: string;
  redemption_url: string;
  voucher_code: string;
  expiry_date: string;
  notes: string;
  image_url: string;
  status: string;
};

const initialForm: FormState = {
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
};

function parseVoucherText(rawText: string) {
  const text = rawText.trim();
  if (!text) return null;

  const normalized = text.replace(/\u200f|\u200e/g, " ");

  const valueMatch =
    normalized.match(/(?:₪|ש["״]?ח)\s*([\d,.]+)/) ||
    normalized.match(/([\d,.]+)\s*(?:₪|ש["״]?ח)/) ||
    normalized.match(/(?:value|amount|שווי|ערך)\s*[:\-]?\s*([\d,.]+)/i);

  const dateMatch =
    normalized.match(/(\d{2}[./-]\d{2}[./-]\d{2,4})/) ||
    normalized.match(
      /(?:בתוקף עד|תוקף עד|expires|valid until|expiry date)\s*[:\-]?\s*(\d{2}[./-]\d{2}[./-]\d{2,4})/i
    );

  const codeMatch =
    normalized.match(
      /(?:קוד|קוד שובר|voucher code|coupon code|gift code|code)\s*[:\-]?\s*([A-Z0-9\-]{4,})/i
    ) ||
    normalized.match(/\b[A-Z0-9]{6,}\b/);

  const urlMatch = normalized.match(/https?:\/\/[^\s]+/i);

  const companyMatch =
    normalized.match(/(?:מותג|חנות|רשת|brand|store)\s*[:\-]?\s*([^\n]+)/i) ||
    normalized.match(/(?:BUYME|FOX|MAX|AZRIELI|GROO|BUY\s?ME)/i);

  const whereMatch = normalized.match(
    /(?:למימוש ב|ניתן למימוש ב|איפה אפשר לממש|redeem at)\s*[:\-]?\s*([^\n]+)/i
  );

  const platformMatch = normalized.match(
    /(?:אפליקציה|אתר|platform|redeem via)\s*[:\-]?\s*([^\n]+)/i
  );

  const cleanNumber = (value?: string | null) =>
    value ? value.replace(/,/g, "").trim() : "";

  const normalizeDate = (value?: string | null) => {
    if (!value) return "";
    const normalizedDate = value.replace(/\./g, "/").replace(/-/g, "/");
    const parts = normalizedDate.split("/");
    if (parts.length !== 3) return "";
    const [dd, mm, yy] = parts;
    const yyyy = yy.length === 2 ? `20${yy}` : yy;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const firstMeaningfulLine =
    lines.find((line) => line.length >= 3 && line.length <= 40) || "";

  return {
    name: firstMeaningfulLine,
    company: companyMatch?.[1]?.trim() || "",
    value: cleanNumber(valueMatch?.[1] || ""),
    currency: normalized.includes("$")
      ? "USD"
      : normalized.includes("€")
      ? "EUR"
      : "ILS",
    redeem_where: whereMatch?.[1]?.trim() || "",
    redemption_platform: platformMatch?.[1]?.trim() || "",
    redemption_url: urlMatch?.[0] || "",
    voucher_code: codeMatch?.[1]?.trim() || codeMatch?.[0]?.trim() || "",
    expiry_date: normalizeDate(dateMatch?.[1] || ""),
    notes: "",
  };
}

export default function AddVoucherForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [form, setForm] = useState<FormState>(initialForm);
  const [pastedText, setPastedText] = useState("");
  const [message, setMessage] = useState("");
  const [imageName, setImageName] = useState("");

  function updateField(name: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const valuePreview = useMemo(() => {
    const amount = Number(form.value || 0);
    if (Number.isNaN(amount)) return "0";
    return amount.toLocaleString("he-IL");
  }, [form.value]);

  function handleSmartFill() {
    setMessage("");

    const parsed = parseVoucherText(pastedText);

    if (!parsed) {
      setMessage("לא נמצא טקסט לניתוח.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: parsed.name || prev.name,
      company: parsed.company || prev.company,
      value: parsed.value || prev.value,
      currency: parsed.currency || prev.currency,
      redeem_where: parsed.redeem_where || prev.redeem_where,
      redemption_platform: parsed.redemption_platform || prev.redemption_platform,
      redemption_url: parsed.redemption_url || prev.redemption_url,
      voucher_code: parsed.voucher_code || prev.voucher_code,
      expiry_date: parsed.expiry_date || prev.expiry_date,
    }));

    setMessage("זיהינו חלק מהפרטים ומילאנו את הטופס.");
  }

  function handleImageSelected(file?: File | null) {
    if (!file) return;
    setImageName(file.name);
    setMessage("התמונה נטענה. כרגע אפשר לשמור שם קובץ/קישור ולמלא את הפרטים לבד או בעזרת טקסט מודבק.");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!form.name.trim()) {
      setMessage("יש להזין שם שובר.");
      return;
    }

    if (form.value && Number(form.value) < 0) {
      setMessage("יש להזין ערך תקין.");
      return;
    }

    startTransition(async () => {
      await createVoucher({
        household_id: householdId,
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        value: Number(form.value || 0),
        currency: form.currency,
        redeem_where: form.redeem_where.trim() || undefined,
        redemption_platform: form.redemption_platform.trim() || undefined,
        redemption_url: form.redemption_url.trim() || undefined,
        voucher_code: form.voucher_code.trim() || undefined,
        expiry_date: form.expiry_date || undefined,
        notes: form.notes.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        status: form.status as "active" | "partially_used" | "used" | "expired",
      });

      setForm(initialForm);
      setPastedText("");
      setImageName("");
      setMessage("");
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("scan")}
          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            mode === "scan"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          <ScanText size={16} />
          סריקה / זיהוי
        </button>

        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            mode === "manual"
              ? "border-cyan-200 bg-cyan-50 text-cyan-700"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          <PenSquare size={16} />
          הזנה ידנית
        </button>
      </div>

      {mode === "scan" && (
        <section className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">סרוק שובר בקלות</h3>
              <p className="mt-1 text-sm text-slate-500">
                העלה תמונה או הדבק טקסט, וננסה למלא את הפרטים בשבילך.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Sparkles size={18} />
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white px-4 py-5 text-center transition hover:bg-slate-50">
            <ImagePlus size={22} className="mb-2 text-slate-500" />
            <span className="text-sm font-semibold text-slate-800">
              העלה צילום מסך / תמונה
            </span>
            <span className="mt-1 text-xs text-slate-500">
              אפשר להעלות תמונה מוואטסאפ, מייל או גלריה
            </span>
            {imageName ? (
              <span className="mt-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {imageName}
              </span>
            ) : null}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageSelected(e.target.files?.[0])}
            />
          </label>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              או הדבק טקסט מתוך הודעה / מייל
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              placeholder="הדבק כאן הודעה עם פרטי השובר, קוד, ערך, תוקף או קישור..."
            />
          </div>

          <button
            type="button"
            onClick={handleSmartFill}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,184,166,0.28)]"
          >
            <Sparkles size={16} />
            מלא לי את הטופס אוטומטית
          </button>
        </section>
      )}

      <section className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">פרטי השובר</h3>
          <div className="rounded-2xl bg-teal-100 p-2.5 text-teal-700">
            <Gift size={16} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              שם השובר
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              placeholder="למשל: BUYME / שובר למסעדה"
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
              placeholder="למשל: FOX / MAX"
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
              placeholder="למשל 250"
              value={form.value}
              onChange={(e) => updateField("value", e.target.value)}
              required
            />
            <div className="mt-2 text-xs text-slate-500">
              תצוגה: <span className="font-semibold text-slate-800">{valuePreview}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              תאריך תפוגה
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <CalendarDays size={16} className="text-teal-500" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                type="date"
                value={form.expiry_date}
                onChange={(e) => updateField("expiry_date", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            מטבע
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["ILS", "USD", "EUR"].map((item) => {
              const active = form.currency === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateField("currency", item)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item === "ILS" && "₪ ILS"}
                  {item === "USD" && "$ USD"}
                  {item === "EUR" && "€ EUR"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            קוד שובר
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Ticket size={16} className="text-cyan-500" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="קוד שובר / מספר שובר"
              value={form.voucher_code}
              onChange={(e) => updateField("voucher_code", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            איפה אפשר לממש
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="אתר / סניף / אונליין / חנות"
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
            placeholder="למשל: BUYME / MAX / GROO"
            value={form.redemption_platform}
            onChange={(e) => updateField("redemption_platform", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            קישור ישיר למימוש
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Link2 size={16} className="text-cyan-500" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="https://..."
              value={form.redemption_url}
              onChange={(e) => updateField("redemption_url", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            תמונה / קישור לתמונה
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            placeholder="אפשר לשמור URL של תמונת השובר"
            value={form.image_url}
            onChange={(e) => updateField("image_url", e.target.value)}
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
            placeholder="תנאים, מגבלות, הערות..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>
      </section>

      {message ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.10)]">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,184,166,0.28)] disabled:opacity-60"
        disabled={isPending}
      >
        <Save size={16} />
        {isPending ? "שומר..." : "שמור שובר"}
      </button>
    </form>
  );
}