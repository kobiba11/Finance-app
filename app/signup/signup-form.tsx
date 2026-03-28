"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateForm() {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage("יש להזין שם מלא.");
      return false;
    }

    if (trimmedName.length < 2) {
      setErrorMessage("השם המלא צריך להכיל לפחות 2 תווים.");
      return false;
    }

    if (!trimmedEmail) {
      setErrorMessage("יש להזין כתובת אימייל.");
      return false;
    }

    if (!password) {
      setErrorMessage("יש להזין סיסמה.");
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

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage("המשתמש לא נוצר.");
        return;
      }

      const identitiesLength = data.user.identities?.length ?? 0;

      if (identitiesLength === 0) {
        setErrorMessage("כבר קיים חשבון עם כתובת האימייל הזו.");
        return;
      }

      if (data.session) {
        setSuccessMessage("ההרשמה הצליחה, מעביר אותך לאפליקציה...");
        setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 800);
        return;
      }

      setSuccessMessage("ההרשמה הצליחה! שלחנו לך מייל לאימות החשבון.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setErrorMessage("אירעה שגיאה לא צפויה. נסה שוב בעוד רגע.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <label
          htmlFor="fullName"
          className="block text-sm font-semibold text-slate-800"
        >
          שם מלא
        </label>

        <div className="relative mt-1 transition-transform duration-200 focus-within:scale-[1.01]">
          <User className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="הכנס שם מלא"
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-800"
        >
          אימייל
        </label>

        <div className="relative mt-1 transition-transform duration-200 focus-within:scale-[1.01]">
          <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-4 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-800"
        >
          סיסמה
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
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-12 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
            aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
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
            required
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pr-11 pl-12 text-right text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
            aria-label={showConfirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </motion.div>

      {errorMessage ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      ) : null}

      {successMessage ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </motion.div>
      ) : null}

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.985 }}
        type="submit"
        disabled={loading}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            נרשם...
          </>
        ) : (
          "הירשם"
        )}
      </motion.button>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-center text-sm text-slate-600"
      >
        כבר יש לך חשבון?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          להתחברות
        </Link>
      </motion.p>
    </form>
  );
}