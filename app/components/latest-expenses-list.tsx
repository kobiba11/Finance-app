"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrencyAmount } from "@/lib/currency";
import SwipeableExpenseRow from "./swipeable-expense-row";
import DeleteExpenseDialog from "./delete-expense-dialog";
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

function getCategoryColors(name: string) {
  switch (name) {
    case "אוכל":
      return { badge: "bg-emerald-100 text-emerald-600" };
    case "חשבונות":
      return { badge: "bg-blue-100 text-blue-600" };
    case "תחבורה":
      return { badge: "bg-orange-100 text-orange-600" };
    case "הוצאות בית":
      return { badge: "bg-indigo-100 text-indigo-600" };
    case "בילויים":
      return { badge: "bg-pink-100 text-pink-600" };
    default:
      return { badge: "bg-slate-100 text-slate-600" };
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

  const [localExpenses, setLocalExpenses] = useState<LatestExpenseRow[]>(expenses);
  const [deleteTarget, setDeleteTarget] = useState<LatestExpenseRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  const openDeleteDialog = (expense: LatestExpenseRow) => {
    setDeleteTarget(expense);
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);

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

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("household_id", membership.household_id);

      if (error) {
        console.error("Delete expense error:", error);
        alert(error.message || "שגיאה במחיקת ההוצאה.");
        return;
      }

      setLocalExpenses((prev) =>
        prev.filter((expense) => expense.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      console.error("Unexpected delete error:", error);
      alert("קרתה שגיאה לא צפויה במחיקה.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditExpense = (expenseId: string) => {
    router.push(`/expenses/${expenseId}/edit`);
  };

  if (!localExpenses.length) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500">
        עדיין אין הוצאות להצגה
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {localExpenses.map((expense) => {
          const categoryName = expense.categories?.name ?? "אחר";
          const colors = getCategoryColors(categoryName);

          return (
            <SwipeableExpenseRow
              key={expense.id}
              onEdit={() => handleEditExpense(expense.id)}
              onDelete={() => openDeleteDialog(expense)}
            >
              <div className="flex w-full items-center justify-between gap-3 rounded-[1.25rem] bg-white px-3 py-3 text-right">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${colors.badge}`}
                  >
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
              </div>
            </SwipeableExpenseRow>
          );
        })}
      </div>

      <DeleteExpenseDialog
        open={!!deleteTarget}
        title={deleteTarget?.title}
        loading={deleteLoading}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDeleteExpense}
      />
    </>
  );
}