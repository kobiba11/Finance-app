"use client";

import { motion } from "framer-motion";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-cyan-500 to-teal-700"
        />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="absolute -left-24 top-[-80px] h-72 w-72 rounded-full bg-white/15 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="absolute right-[-80px] top-24 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35 }}
          className="absolute bottom-[-100px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl"
        />

        <div className="absolute left-1/2 top-[28%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="absolute inset-x-0 top-0 h-[46%] overflow-hidden">
          <svg
            viewBox="0 0 1440 500"
            className="h-full w-full object-cover opacity-25"
            preserveAspectRatio="none"
          >
            <path
              fill="white"
              d="M0,224L60,234.7C120,245,240,267,360,256C480,245,600,203,720,186.7C840,171,960,181,1080,197.3C1200,213,1320,235,1380,245.3L1440,256L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
          </svg>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden">
          <svg
            viewBox="0 0 1440 400"
            className="h-full w-full object-cover opacity-20"
            preserveAspectRatio="none"
          >
            <path
              fill="white"
              d="M0,160L80,170.7C160,181,320,203,480,224C640,245,800,267,960,250.7C1120,235,1280,181,1360,154.7L1440,128L1440,400L1360,400C1280,400,1120,400,960,400C800,400,640,400,480,400C320,400,160,400,80,400L0,400Z"
            />
          </svg>
        </div>

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
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/30 bg-white/20 text-2xl font-bold shadow-lg backdrop-blur-xl"
            >
              ₪
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              ברוך הבא
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 }}
              className="mt-3 text-sm leading-6 text-white/90"
            >
              התחבר כדי לנהל את ההוצאות, התקציבים והמנויים שלך במקום אחד
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.35, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className="rounded-[2rem] border border-white/35 bg-white/95 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
          >
            <LoginForm />
          </motion.div>
        </div>
      </div>
    </main>
  );
}