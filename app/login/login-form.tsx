"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("יש למלא אימייל וסיסמה.");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError("האימייל או הסיסמה שגויים. נסה שוב.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה לא צפויה. נסה שוב בעוד רגע.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");

    try {
      setIsGoogleLoading(true);

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setError("לא הצלחנו להתחבר עם Google כרגע.");
      }
    } catch (err) {
      console.error(err);
      setError("אירעה שגיאה בהתחברות עם Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleLogin}
      className="space-y-7"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="space-y-2.5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-800"
        >
          אימייל
        </label>

        <div className="relative transition-transform duration-200 focus-within:scale-[1.01]">
          <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>
      </motion.div>

      <motion.div
        className="space-y-2.5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-800"
          >
            סיסמה
          </label>

          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            שכחתי סיסמה
          </Link>
        </div>

        <div className="relative transition-transform duration-200 focus-within:scale-[1.01]">
          <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="הכנס סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-12 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
          />

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
            aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm text-red-700 shadow-sm"
        >
          {error}
        </motion.div>
      ) : null}

      <motion.button
        type="submit"
        disabled={isLoading}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            מתחבר...
          </>
        ) : (
          "התחברות"
        )}
      </motion.button>

      <motion.div
        className="relative py-1"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/90" />
        </div>

        <div className="relative flex justify-center">
          <span className="rounded-full bg-white px-4 py-1 text-xs font-medium text-slate-500 shadow-sm">
            או
          </span>
        </div>
      </motion.div>

      <motion.button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.34 }}
        whileHover={{ scale: 1.015, y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            מעביר ל-Google...
          </>
        ) : (
          <>
            <svg
              className="ml-2 h-5 w-5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M21.805 10.023h-9.18v3.955h5.264c-.227 1.273-1.5 3.733-5.264 3.733a5.872 5.872 0 1 1 0-11.744c2.146 0 3.582.918 4.406 1.71l3.009-2.91C18.3 3.145 15.81 2 12.625 2a10.124 10.124 0 1 0 0 20.248c5.846 0 9.719-4.109 9.719-9.898 0-.668-.074-1.145-.164-1.527Z"
              />
            </svg>
            התחברות עם Google
          </>
        )}
      </motion.button>

      <motion.p
        className="pt-1 text-center text-sm text-slate-600"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.42 }}
      >
        עדיין אין לך חשבון?{" "}
        <Link
          href="/signup"
          className="font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          להרשמה
        </Link>
      </motion.p>
    </motion.form>
  );
}