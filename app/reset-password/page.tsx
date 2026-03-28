"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CircleAlert,
  CircleCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateForm() {
    if (!password) {
      setErrorMessage("יש להזין סיסמה חדשה.");
      return false;
    }

    if (password.length < 6) {
      setErrorMessage("הסיסמה צריכה להכיל לפחות 6 תווים.");
      return false;
    }

    if (!confirmPassword) {
      setErrorMessage("יש לאשר את הסיסמה.");
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage("הסיסמאות אינן תואמות.");
      return false;
    }

    return true;
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage("הסיסמה עודכנה בהצלחה. מעביר להתחברות...");

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMessage("אירעה שגיאה לא צפויה. נסה שוב בעוד רגע.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-cyan-500 to-teal-700"
        />

        <div className="absolute -left-24 top-[-80px] h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute right-[-80px] top-24 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute left-1/2 top-[28%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-7 text-center text-white"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/30 bg-white/20 text-2xl font-bold shadow-lg backdrop-blur-xl">
              <Lock className="h-7 w-7" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              איפוס סיסמה
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/90">
              הזן סיסמה חדשה כדי להשלים את תהליך האיפוס
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.35, ease: "easeOut" }}
            className="rounded-[2rem] border border-white/35 bg-white/95 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
          >
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-800"
                >
                  סיסמה חדשה
                </label>

                <div className="relative mt-1 transition-transform duration-200 focus-within:scale-[1.01]">
                  <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-12 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-slate-800"
                >
                  אימות סיסמה
                </label>

                <div className="relative mt-1 transition-transform duration-200 focus-within:scale-[1.01]">
                  <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="הכנס שוב את הסיסמה"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-12 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              {successMessage ? (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  "שמור סיסמה חדשה"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}