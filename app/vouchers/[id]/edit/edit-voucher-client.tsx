"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Gift,
  Link as LinkIcon,
  Loader2,
  PencilLine,
  Save,
  ScanText,
  Sparkles,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../../components/bottom-nav";
import { parseVoucherText } from "@/lib/vouchers/parse-voucher-text";

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
  notes?: string | null;
  image_url?: string | null;
  source_text?: string | null;
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

  const [mode, setMode] = useState<"smart" | "manual">("manual");

  const [name, setName] = useState(voucher.name || "");
  const [company, setCompany] = useState(voucher.company || "");
  const [value, setValue] = useState(
    voucher.value !== null && voucher.value !== undefined ? String(voucher.value) : ""
  );
  const [currency, setCurrency] = useState(voucher.currency || "ILS");
  const [redeemWhere, setRedeemWhere] = useState(voucher.redeem_where || "");
  const [redemptionPlatform, setRedemptionPlatform] = useState(
    voucher.redemption_platform || ""
  );
  const [redemptionUrl, setRedemptionUrl] = useState(voucher.redemption_url || "");
  const [voucherCode, setVoucherCode] = useState(voucher.voucher_code || "");
  const [expiryDate, setExpiryDate] = useState(formatDateForInput(voucher.expiry_date));
  const [status, setStatus] = useState(voucher.status || "active");
  const [notes, setNotes] = useState(voucher.notes || "");
  const [imageUrl, setImageUrl] = useState(voucher.image_url || "");
  const [sourceText, setSourceText] = useState(voucher.source_text || "");

  const [rawInput, setRawInput] = useState(voucher.source_text || "");
  const [ocrText, setOcrText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(voucher.image_url || "");

  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState("");

  const hasSource = useMemo(() => {
    return rawInput.trim().length > 0 || !!imageFile;
  }, [rawInput, imageFile]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
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

  async function uploadImageIfNeeded() {
    if (!imageFile) return imageUrl.trim() || null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const originalName = imageFile.name || "voucher-image";
    const fileExt = originalName.includes(".")
      ? originalName.split(".").pop()
      : "jpg";

    const safeExt = fileExt?.toLowerCase() || "jpg";
    const fileName = `${voucher.household_id ?? "unknown-household"}/${user?.id ?? "anonymous"}/${Date.now()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("vouchers")
      .upload(fileName, imageFile, {
        upsert: false,
        contentType: imageFile.type || undefined,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("vouchers").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSmartAnalyze() {
    try {
      setMessage("");
      setIsScanning(true);

      let combinedText = rawInput.trim();
      let recognizedText = "";

      if (imageFile) {
        recognizedText = await runImageOcr(imageFile);
        setOcrText(recognizedText);
      }

      combinedText = [combinedText, recognizedText].filter(Boolean).join("\n\n");

      if (!combinedText.trim()) {
        setMessage("תדביק טקסט או תעלה תמונה כדי לבצע זיהוי.");
        return;
      }

      const parsed = parseVoucherText(combinedText);

      setName(parsed.title || "");
      setCompany(parsed.brand || "");
      setValue(parsed.value || "");
      setCurrency(parsed.currency || "ILS");
      setExpiryDate(parsed.expiresAt || "");
      setVoucherCode(parsed.code || "");
      setRedeemWhere(parsed.redeemAt || "");
      setRedemptionPlatform(parsed.redeemApp || "");
      setRedemptionUrl(parsed.directLink || "");
      setSourceText(parsed.rawText || combinedText);

      if (!notes.trim() && parsed.notes) {
        setNotes(parsed.notes);
      }

      if (!rawInput.trim()) {
        setRawInput(combinedText);
      }
    } catch (error) {
      console.error("Analyze voucher error:", error);
      setMessage("הזיהוי נכשל. אפשר לנסות שוב או לעדכן ידנית.");
    } finally {
      setIsScanning(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const finalImageUrl = await uploadImageIfNeeded();

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
        notes: notes.trim() || null,
        image_url: finalImageUrl,
        source_text: sourceText.trim() || rawInput.trim() || null,
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
    <main className="min-h-screen bg-gradient-to-b from-teal-300 via-cyan-400 to-teal-500 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/vouchers")}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              <ArrowRight size={18} />
            </button>

            <div className="min-w-0 text-right">
              <p className="text-xs font-medium text-slate-500">עדכון פרטי שובר</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">עריכת שובר</h1>
              <p className="mt-1 text-sm text-slate-500">עדכון פרטי השובר באותו קו של ההוספה</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Camera size={18} className="text-teal-600" />
                  העלאת תמונה / צילום מסך
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-teal-200 bg-teal-50/70 px-4 py-6 text-center transition hover:border-teal-300 hover:bg-teal-50">
                  <Upload className="mb-2 text-teal-600" size={22} />
                  <span className="text-sm font-medium text-slate-700">לחץ להעלאת תמונה</span>
                  <span className="mt-1 text-xs text-slate-500">מתאים גם לצילום מהמובייל</span>
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
              </section>

              <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
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
              </section>
            </div>
          )}

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  שם השובר
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <Gift size={16} className="text-teal-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="למשל: שובר BUYME"
                    className="w-full bg-transparent text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  מותג / חנות
                </label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="למשל: FOX"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    שווי
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    מטבע
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="ILS">₪ ILS</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  איפה אפשר לממש
                </label>
                <input
                  value={redeemWhere}
                  onChange={(e) => setRedeemWhere(e.target.value)}
                  placeholder="למשל: אתר / סניף / אפליקציה"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  אפליקציה / אתר למימוש
                </label>
                <input
                  value={redemptionPlatform}
                  onChange={(e) => setRedemptionPlatform(e.target.value)}
                  placeholder="למשל: BUYME"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  קישור ישיר למימוש
                </label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <LinkIcon size={16} className="text-cyan-500" />
                  <input
                    value={redemptionUrl}
                    onChange={(e) => setRedemptionUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  קוד שובר
                </label>
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="קוד / מספר שובר"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  תאריך תפוגה
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
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
                  <option value="active">פעיל</option>
                  <option value="partially_used">מומש חלקית</option>
                  <option value="used">נוצל</option>
                  <option value="expired">פג תוקף</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  קישור לתמונה
                </label>
                <input
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setImagePreview(e.target.value);
                    }
                  }}
                  placeholder="URL לתמונה / צילום שובר"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  טקסט מקור / OCR
                </label>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="טקסט מקור של השובר"
                  className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  הערות
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="תנאים / מגבלות / הערות"
                  className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/vouchers")}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              ביטול
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,184,166,0.28)] disabled:opacity-60"
            >
              <Save size={16} />
              {loading ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </form>

        {message && (
          <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}