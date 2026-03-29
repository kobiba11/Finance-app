"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

type ExpenseListRow = {
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

type ExpensesListProps = {
  expenses: ExpenseListRow[];
  emptyText?: string;
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

export default function ExpensesList({
  expenses,
  emptyText = "עדיין אין הוצאות להצגה",
}: ExpensesListProps) {
  const router = useRouter();
  const supabase = createClient();

  const [localExpenses, setLocalExpenses] = useState<ExpenseListRow[]>(expenses);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseListRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setLocalExpenses(expenses);
  }, [expenses]);

  const openDeleteDialog = (expense: ExpenseListRow) => {
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

    const { data: deletedRows, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", deleteTarget.id)
      .select("id");

    console.log("deleteTarget.id:", deleteTarget.id);
    console.log("deletedRows:", deletedRows);
    console.log("delete error:", error);

    if (error) {
      alert(error.message || "שגיאה במחיקת ההוצאה.");
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      alert("לא נמחקה אף הוצאה בפועל. כנראה יש בעיית הרשאות.");
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

  if (localExpenses.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {localExpenses.map((expense) => {
          const categoryName = expense.categories?.name ?? "אחר";
          const colors = getCategoryColors(categoryName);

          return (
            <SwipeableExpenseRow
              key={expense.id}
              onEdit={() => handleEditExpense(expense.id)}
              onDelete={() => openDeleteDialog(expense)}
            >
              <div className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-3 text-right">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colors.badge}`}
                  >
                    {getCategoryIcon(categoryName)}
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-slate-900">{expense.title}</p>
                    <p className="text-xs text-slate-500">
                      {categoryName} ·{" "}
                      {new Date(expense.expense_date).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>

                <p className="font-semibold text-slate-900">
                  ₪{Number(expense.amount).toFixed(2)}
                </p>
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