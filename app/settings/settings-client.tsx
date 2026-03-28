"use client";

import { useMemo, useState } from "react";
import {
  Wallet,
  Coins,
  House,
  Copy,
  Save,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppCard from "../components/app-card";

type SettingsClientProps = {
  userId: string;
  householdId: string;
  role: string;
  householdName: string;
  baseCurrency: string;
  inviteCode: string;
  monthlyBudget: number;
};

function getCurrencyLabel(currency: string) {
  switch (currency) {
    case "ILS":
      return "₪ שקל";
    case "USD":
      return "$ דולר";
    case "EUR":
      return "€ יורו";
    default:
      return "₪ שקל";
  }
}

export default function SettingsClient({
  userId,
  householdId,
  role,
  householdName,
  baseCurrency,
  inviteCode,
  monthlyBudget,
}: SettingsClientProps) {
  const supabase = createClient();

  const [budget, setBudget] = useState(String(monthlyBudget || ""));
  const [currency, setCurrency] = useState(baseCurrency || "ILS");
  const [joinCode, setJoinCode] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [joiningHousehold, setJoiningHousehold] = useState(false);
  const [message, setMessage] = useState("");

  const canManageHousehold = role === "owner";

  const budgetPreview = useMemo(() => {
    const num = Number(budget || 0);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString("he-IL");
  }, [budget]);

  async function handleSaveBudget() {
    try {
      setSavingBudget(true);
      setMessage("");

      const amount = Number(budget);

      if (Number.isNaN(amount) || amount < 0) {
        setMessage("נא להזין תקציב תקין.");
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const monthNumber = String(now.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${monthNumber}-01`;

      const { error } = await supabase
        .from("monthly_budgets")
        .upsert(
          {
            household_id: householdId,
            month: monthKey,
            amount,
            currency,
          },
          {
            onConflict: "household_id,month",
          }
        );

      if (error) {
        setMessage(`שמירת התקציב נכשלה: ${error.message}`);
        return;
      }

      setMessage("התקציב החודשי נשמר בהצלחה.");
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleSaveCurrency() {
    try {
      setSavingCurrency(true);
      setMessage("");

      const { error } = await supabase
        .from("households")
        .update({ base_currency: currency })
        .eq("id", householdId);

      if (error) {
        setMessage(`שמירת המטבע נכשלה: ${error.message}`);
        return;
      }

      setMessage("המטבע נשמר בהצלחה.");
    } finally {
      setSavingCurrency(false);
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setMessage("קוד ההזמנה הועתק.");
    } catch {
      setMessage("לא הצלחתי להעתיק את הקוד.");
    }
  }

  async function handleJoinHousehold() {
    try {
      setJoiningHousehold(true);
      setMessage("");

      const cleanCode = joinCode.trim().toUpperCase();

      if (!cleanCode) {
        setMessage("נא להזין קוד הזמנה.");
        return;
      }

      const { data: targetHousehold, error: householdError } = await supabase
        .from("households")
        .select("id, name")
        .eq("invite_code", cleanCode)
        .single();

      if (householdError || !targetHousehold) {
        setMessage("קוד ההזמנה לא נמצא.");
        return;
      }

      if (targetHousehold.id === householdId) {
        setMessage("אתה כבר מחובר למשק הזה.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("household_members")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        setMessage("לא הצלחתי לעדכן את שיוך המשתמש.");
        return;
      }

      const { error: insertError } = await supabase
        .from("household_members")
        .insert({
          household_id: targetHousehold.id,
          user_id: userId,
          role: "member",
        });

      if (insertError) {
        setMessage("הצטרפות למשק נכשלה.");
        return;
      }

      setMessage(`הצטרפת בהצלחה ל־${targetHousehold.name}.`);
      window.location.reload();
    } finally {
      setJoiningHousehold(false);
    }
  }

  return (
    <>
     

      <AppCard className="mb-4 !p-4">
        <h1 className="text-3xl font-bold text-slate-900">הגדרות</h1>
        <p className="mt-1 text-sm text-slate-500">ניהול תקציב, מטבע ומשק בית</p>
      </AppCard>

      <div className="space-y-4">
        <AppCard className="!p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">תקציב חודשי</h2>
              <p className="mt-1 text-sm text-slate-500">
                התקציב שמוגדר כאן אמור להופיע גם בדשבורד.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-100/80 p-3 text-emerald-700">
              <Wallet size={20} />
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              סכום התקציב
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-right text-base text-slate-900 outline-none transition focus:border-emerald-400"
              placeholder="למשל 8000"
            />

            <div className="mt-3 text-sm text-slate-500">
              תצוגה מקדימה:{" "}
              <span className="font-semibold text-slate-800">{budgetPreview}</span>
            </div>
          </div>

          <button
            onClick={handleSaveBudget}
            disabled={savingBudget}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <Save size={16} />
            {savingBudget ? "שומר..." : "שמור תקציב"}
          </button>
        </AppCard>

        <AppCard className="!p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">מטבע</h2>
              <p className="mt-1 text-sm text-slate-500">
                המטבע הנבחר ישפיע על ההצגה בדשבורד ובשאר המודולים.
              </p>
            </div>

            <div className="rounded-2xl bg-cyan-100/80 p-3 text-cyan-700">
              <Coins size={20} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["ILS", "USD", "EUR"].map((item) => {
              const active = currency === item;

              return (
                <button
                  key={item}
                  onClick={() => setCurrency(item)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-emerald-400 bg-emerald-50/90 text-emerald-700 shadow-sm"
                      : "border-slate-200 bg-white/80 text-slate-600"
                  }`}
                >
                  {item === "ILS" && "₪ ILS"}
                  {item === "USD" && "$ USD"}
                  {item === "EUR" && "€ EUR"}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-sm text-slate-500">
            נבחר כרגע:{" "}
            <span className="font-semibold text-slate-800">
              {getCurrencyLabel(currency)}
            </span>
          </div>

          <button
            onClick={handleSaveCurrency}
            disabled={savingCurrency}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <Save size={16} />
            {savingCurrency ? "שומר..." : "שמור מטבע"}
          </button>
        </AppCard>

        <AppCard className="!p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">משק בית משותף</h2>
              <p className="mt-1 text-sm text-slate-500">
                שתף קוד הזמנה כדי לצרף משתמש נוסף לאותו משק בית.
              </p>
            </div>

            <div className="rounded-2xl bg-violet-100/80 p-3 text-violet-700">
              <House size={20} />
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="text-sm text-slate-500">שם משק הבית</div>
            <div className="mt-1 text-base font-semibold text-slate-900">
              {householdName}
            </div>

            <div className="mt-4 text-sm text-slate-500">קוד הזמנה</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-center text-base font-bold tracking-[0.25em] text-slate-900">
                {inviteCode || "------"}
              </div>

              <button
                onClick={handleCopyCode}
                className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-slate-700 transition hover:bg-white"
                aria-label="העתק קוד"
              >
                <Copy size={18} />
              </button>
            </div>

            {!canManageHousehold && (
              <p className="mt-3 text-xs text-slate-500">
                כל מי ששייך למשק יכול להשתמש בקוד ההזמנה ולצפות בהגדרות המשותפות.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              הצטרפות למשק קיים באמצעות קוד
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-right text-base text-slate-900 outline-none transition focus:border-emerald-400"
                placeholder="הזן קוד הזמנה"
              />

              <button
                onClick={handleJoinHousehold}
                disabled={joiningHousehold}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              >
                <Link2 size={16} />
                {joiningHousehold ? "מצרף..." : "הצטרף"}
              </button>
            </div>
          </div>
        </AppCard>

        {message ? (
          <div className="flex items-center gap-2 rounded-[1.25rem] border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.10)]">
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        ) : null}
      </div>
    </>
  );
}