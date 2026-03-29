"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  Camera,
  Gift,
  Link as LinkIcon,
  Loader2,
  PencilLine,
  ScanText,
  Sparkles,
  Upload,
} from "lucide-react";
import { parseVoucherText, ParsedVoucherData } from "@/lib/vouchers/parse-voucher-text";

type VoucherDraft = ParsedVoucherData & {
  imageFile?: File | null;
};

type AddVoucherSmartFormProps = {
  onSubmitVoucher: (payload: VoucherDraft) => Promise<void>;
  onClose?: () => void;
};

const emptyForm: VoucherDraft = {
  title: "",
  brand: "",
  value: "",
  currency: "ILS",
  expiresAt: "",
  code: "",
  redeemAt: "",
  redeemApp: "",
  directLink: "",
  notes: "",
  rawText: "",
  imageFile: null,
};

export default function AddVoucherSmartForm({
  onSubmitVoucher,
  onClose,
}: AddVoucherSmartFormProps) {
  const [mode, setMode] = useState<"smart" | "manual">("smart");
  const [form, setForm] = useState<VoucherDraft>(emptyForm);
  const [rawInput, setRawInput] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const hasSource = useMemo(() => {
    return rawInput.trim().length > 0 || !!form.imageFile;
  }, [rawInput, form.imageFile]);

  function updateField<K extends keyof VoucherDraft>(key: K, value: VoucherDraft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    updateField("imageFile", file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function cleanOCRText(text: string) {
  return text
    .replace(/[^\x00-\x7F\u0590-\u05FF0-9₪$€:/.\-()\n ]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

async function runImageOcr(file: File) {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng+heb");

  try {
    const result = await worker.recognize(file);
    const raw = result.data.text ?? "";

    const cleaned = cleanOCRText(raw);

    return cleaned;
  } finally {
    await worker.terminate();
  }
}

  async function handleSmartAnalyze() {
    try {
      setError("");
      setIsScanning(true);

      let combinedText = rawInput.trim();
      let imageText = "";

      if (form.imageFile) {
        imageText = await runImageOcr(form.imageFile);
        setOcrText(imageText);
      }

      combinedText = [combinedText, imageText].filter(Boolean).join("\n\n");

      if (!combinedText.trim()) {
        setError("תדביק טקסט או תעלה תמונה כדי לבצע זיהוי.");
        return;
      }

      const parsed = parseVoucherText(combinedText);

      setForm((prev) => ({
        ...prev,
        ...parsed,
        imageFile: prev.imageFile,
        notes: prev.notes || parsed.notes,
      }));

      if (!rawInput.trim()) {
        setRawInput(combinedText);
      }
    } catch (err) {
      console.error(err);
      setError("הזיהוי נכשל. נסה שוב או עבור להזנה ידנית.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSubmit() {
    try {
      setError("");
      setIsSaving(true);

      if (!form.title.trim()) {
        setError("חסר שם לשובר.");
        return;
      }

      await onSubmitVoucher(form);

      setForm(emptyForm);
      setRawInput("");
      setOcrText("");
      setImagePreview("");
      onClose?.();
    } catch (err) {
      console.error(err);
      setError("שמירת השובר נכשלה.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-white/35 bg-white/92 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("smart")}
            className={`flex items-center justify-center gap-2 rounded-[1.35rem] px-4 py-3 text-sm font-semibold transition ${
              mode === "smart"
                ? "bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <ScanText size={17} />
            סריקה / זיהוי
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex items-center justify-center gap-2 rounded-[1.35rem] px-4 py-3 text-sm font-semibold transition ${
              mode === "manual"
                ? "bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <PencilLine size={17} />
            הזנה ידנית
          </button>
        </div>
      </div>

      {mode === "smart" && (
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/35 bg-white/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Camera size={18} className="text-teal-600" />
              העלאת תמונה / צילום מסך
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-teal-200 bg-teal-50/70 px-4 py-6 text-center transition hover:border-teal-300 hover:bg-teal-50">
              <Upload className="mb-2 text-teal-600" size={22} />
              <span className="text-sm font-medium text-slate-700">
                לחץ להעלאת תמונה
              </span>
              <span className="mt-1 text-xs text-slate-500">
                מתאים גם לצילום מהמובייל
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {imagePreview && (
              <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-slate-200">
                <img
                  src={imagePreview}
                  alt="Voucher preview"
                  className="h-52 w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/35 bg-white/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles size={18} className="text-teal-600" />
              הדבקת טקסט מהודעה / מייל / וואטסאפ
            </div>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="הדבק כאן את הטקסט של השובר..."
              className="min-h-[130px] w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white"
            />

            <button
              type="button"
              onClick={handleSmartAnalyze}
              disabled={!hasSource || isScanning}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-md transition disabled:opacity-60"
            >
              {isScanning ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  מבצע זיהוי...
                </>
              ) : (
                <>
                  <ScanText size={17} />
                  נתח ומלא אוטומטית
                </>
              )}
            </button>

            {ocrText && (
              <div className="mt-3 rounded-[1.25rem] bg-slate-50 p-3">
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  טקסט שזוהה מהתמונה
                </div>
                <div className="max-h-32 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
                  {ocrText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-white/35 bg-white/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Gift size={18} className="text-teal-600" />
          פרטי השובר
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Input
            label="שם השובר"
            value={form.title}
            onChange={(value) => updateField("title", value)}
            placeholder="למשל: שובר BUYME"
          />

          <Input
            label="מותג / חנות"
            value={form.brand}
            onChange={(value) => updateField("brand", value)}
            placeholder="למשל: FOX / BUYME / שופרסל"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ערך"
              value={form.value}
              onChange={(value) => updateField("value", value)}
              placeholder="100"
              inputMode="decimal"
            />

            <Select
              label="מטבע"
              value={form.currency}
              onChange={(value) => updateField("currency", value)}
              options={[
                { value: "ILS", label: "ILS" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
              ]}
            />
          </div>

          <Input
            label="תאריך תפוגה"
            type="date"
            value={form.expiresAt}
            onChange={(value) => updateField("expiresAt", value)}
          />

          <Input
            label="קוד שובר"
            value={form.code}
            onChange={(value) => updateField("code", value)}
            placeholder="ABC123XYZ"
          />

          <Input
            label="איפה אפשר לממש"
            value={form.redeemAt}
            onChange={(value) => updateField("redeemAt", value)}
            placeholder="אתרים / סניפים / רשתות"
          />

          <Input
            label="אפליקציה / אתר למימוש"
            value={form.redeemApp}
            onChange={(value) => updateField("redeemApp", value)}
            placeholder="BUYME / MAX / אתר המותג"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              קישור ישיר
            </label>
            <div className="flex items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-teal-300 focus-within:bg-white">
              <LinkIcon size={16} className="text-slate-400" />
              <input
                type="url"
                value={form.directLink}
                onChange={(e) => updateField("directLink", e.target.value)}
                placeholder="https://..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              הערות
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="הערות נוספות..."
              className="min-h-[90px] w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[1.4rem] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[1.5rem] bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow"
        >
          ביטול
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-[1.5rem] bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
        >
          {isSaving ? "שומר..." : "שמור שובר"}
        </button>
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: InputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white"
      />
    </div>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}