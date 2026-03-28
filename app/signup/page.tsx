"use client";

import { motion } from "framer-motion";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      {/* Background */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-cyan-500 to-teal-700"
        />

        <div className="absolute left-1/2 top-[28%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-7 text-center text-white"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/30 bg-white/20 text-2xl font-bold shadow-lg backdrop-blur-xl">
              K
            </div>

            <h1 className="text-4xl font-bold">הרשמה</h1>
            <p className="mt-2 text-sm text-white/90">
              בוא ניצור לך חשבון חדש
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="rounded-[2rem] border border-white/30 bg-white/95 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
          >
            <SignupForm />
          </motion.div>
        </div>
      </div>
    </main>
  );
}