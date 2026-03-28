"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyAmount } from "@/lib/currency";
import SwipeableExpenseRow from "./swipeable-expense-row";
import {
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  PartyPopper,
  CircleEllipsis,
} from "lucide-react";

type LatestExpenseRow = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  expense_date: string;
  category_id: string | null;
  categories: {
    name: string;
    icon: string | null;
  } | null;
};

type LatestExpensesListProps = {
  expenses: LatestExpenseRow[];
};

function getCategoryIcon(name: string) {
  switch (name) {
    case "אוכל":
      return <UtensilsCrossed size={18} />;
    case "תחבורה":
      return <Car size={18} />;
    case "הוצאות בית":
      return <Home size={18} />;
    case "חשבונות":
      return <Receipt size={18} />;
    case "בילויים":
      return <PartyPopper size={18} />;
    default:
      return <CircleEllipsis size={18} />;
  }
}

function formatExpenseDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function LatestExpensesList({
  expenses,
}: LatestExpensesListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!expenses.length) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
        עדיין אין הוצאות להצגה
      </div>
    );
  }

  const handleDelete = async (expenseId: string) => {
    const confirmed = window.confirm("בטוח שברצונך למחוק את ההוצאה?");
    if (!confirmed) return;

    try {
      setDeletingId(expenseId);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("המשתמש לא מחובר.");
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError || !membership?.household_id) {
        alert("לא נמצא משק בית למשתמש.");
        return;
      }

      const { data, error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId)
        .eq("household_id", membership.household_id)
        .select("id")
        .single();

      if (error || !data) {
        console.error("Delete expense error:", error);
        alert("מחיקת ההוצאה נכשלה.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Unexpected delete error:", error);
      alert("קרתה שגיאה לא צפויה במחיקה.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const categoryName = expense.categories?.name ?? "אחר";

        return (
          <SwipeableExpenseRow
            key={expense.id}
            onEdit={() => router.push(`/expenses/${expense.id}/edit`)}
            onDelete={() => handleDelete(expense.id)}
          >
            <button
              type="button"
              disabled={deletingId === expense.id}
              onClick={() => router.push(`/expenses/${expense.id}/edit`)}
              className="flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white/80 px-3 py-3 text-right transition hover:bg-white disabled:opacity-60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  {getCategoryIcon(categoryName)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {expense.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{categoryName}</span>
                    <span>•</span>
                    <span>{formatExpenseDate(expense.expense_date)}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-left">
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrencyAmount(expense.amount, expense.currency)}
                </p>
              </div>
            </button>
          </SwipeableExpenseRow>
        );
      })}
    </div>
  );
}