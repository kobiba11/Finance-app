import { Suspense } from "react";
import NewExpensePageClient from "./new-expense-page-client";

export default function NewExpensePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-600">
          <div className="mx-auto max-w-[440px] px-4 py-6">
            <div className="rounded-[2rem] border border-white/35 bg-white/90 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <p className="text-sm font-medium text-slate-500">טוען...</p>
            </div>
          </div>
        </main>
      }
    >
      <NewExpensePageClient />
    </Suspense>
  );
}