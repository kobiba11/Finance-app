import { Suspense } from "react";
import NewExpensePageClient from "./new-expense-page-client";

export default function NewExpensePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f7f8] pb-24">
          <div className="mx-auto max-w-[440px] px-4 py-6">
            <p className="text-center text-slate-500">טוען...</p>
          </div>
        </main>
      }
    >
      <NewExpensePageClient />
    </Suspense>
  );
}