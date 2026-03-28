"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../../components/bottom-nav";
import DeleteExpenseDialog from "../../../components/delete-expense-dialog";
import {
  CalendarDays,
  UtensilsCrossed,
  Receipt,
  Home,
  Car,
  PartyPopper,
  CircleEllipsis,
  Trash2,
  ArrowRight,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  expense_date: string;
  notes: string | null;
  category_id: string | null;
  household_id: string;
};

const categoryOrder = [
  "אוכל",
  "הוצאות בית",
  "חשבונות",
  "בילויים",
  "תחבורה",
  "אחר",
];

function getCategoryVisual(name: string) {
  switch (name) {
    case "אוכל":
      return {
        icon: UtensilsCrossed,
        active: "bg-emerald-500 text-white border-emerald-500",
        idle: "bg-white text-slate-700 border-slate-200",
      };
    case "הוצאות בית":
      return {
        icon: Home,
        active: "bg-emerald-500 text-white border-emerald-500",
        idle: "bg-white text-slate-700 border-slate-200",
      };
    case "חשבונות":
      return {
        icon: Receipt,
        active: "bg-emerald-500 text-white border-emerald-500",
        idle: "bg-white text-slate-700 border-slate-200",
      };
    case "בילויים":
      return {
        icon: PartyPopper,
        active: "bg-emerald-500 text-white border-emerald-500",
        idle: "bg-white text-slate-700 border-slate-200",
      };
    case "תחבורה":
      return {
        icon: Car,
        active: "bg-emerald-500 text-white border-emerald-500",
        idle: "bg-white text-slate-700 border-slate-200",
      };
    default:
      return {
        icon: CircleEllipsis,
        active: "bg-emerald-500 text-white border-emerald-500",
        idle: "bg-white text-slate-700 border-slate-200",
      };
  }
}

export default function EditExpensePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [householdId, setHouseholdId] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        setMessage("");
        setSuccessMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: membership, error: membershipError } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError || !membership?.household_id) {
          setMessage("לא נמצא משק בית למשתמש.");
          return;
        }

        setHouseholdId(membership.household_id);

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, icon")
          .order("name", { ascending: true });

        if (categoriesError) {
          setMessage("שגיאה בטעינת הקטגוריות.");
          return;
        }

        const sortedCategories = [...(categoriesData || [])].sort((a, b) => {
          const aIndex = categoryOrder.indexOf(a.name);
          const bIndex = categoryOrder.indexOf(b.name);
          const safeA = aIndex === -1 ? 999 : aIndex;
          const safeB = bIndex === -1 ? 999 : bIndex;
          return safeA - safeB;
        });

        setCategories(sortedCategories);

        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select(
            "id, title, amount, currency, expense_date, notes, category_id, household_id"
          )
          .eq("id", expenseId)
          .eq("household_id", membership.household_id)
          .maybeSingle<ExpenseRow>();

        if (expenseError || !expenseData) {
          console.error("Load expense error:", expenseError);
          setMessage("לא נמצאה הוצאה לעריכה.");
          return;
        }

        setTitle(expenseData.title || "");
        setAmount(String(expenseData.amount ?? ""));
        setSelectedCategoryId(expenseData.category_id || "");
        setExpenseDate(expenseData.expense_date || "");
        setNotes(expenseData.notes || "");
      } catch (error) {
        console.error("Unexpected load error:", error);
        setMessage("קרתה שגיאה לא צפויה.");
      } finally {
        setPageLoading(false);
      }
    };

    if (expenseId) {
      loadData();
    }
  }, [expenseId, router, supabase]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!amount || Number(amount) <= 0) {
    setMessage("יש להזין סכום תקין.");
    return;
  }

  if (!selectedCategoryId) {
    setMessage("יש לבחור קטגוריה.");
    return;
  }

  if (!expenseDate) {
    setMessage("יש לבחור תאריך.");
    return;
  }

  const finalTitle =
    title.trim() || `הוצאה - ${selectedCategory?.name || "ללא קטגוריה"}`;

  try {
    setSaving(true);
    setMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("expenses")
      .update({
        title: finalTitle,
        amount: Number(amount),
        category_id: selectedCategoryId,
        expense_date: expenseDate,
        notes: notes.trim() || null,
      })
      .eq("id", expenseId)
      .eq("household_id", householdId);

    if (error) {
      console.error("Update expense error:", error);
      setMessage(error.message || "שגיאה בעדכון ההוצאה.");
      return;
    }

    setSuccessMessage("השינויים נשמרו בהצלחה.");

    setTimeout(() => {
      router.push("/expenses");
      router.refresh();
    }, 500);
  } catch (error) {
    console.error("Unexpected save error:", error);
    setMessage("קרתה שגיאה לא צפויה בעת השמירה.");
  } finally {
    setSaving(false);
  }
};

const handleDelete = async () => {
  try {
    setDeleting(true);
    setMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("household_id", householdId);

    if (error) {
      console.error("Delete expense error:", error);
      setMessage(error.message || "שגיאה במחיקת ההוצאה.");
      return;
    }

    setDeleteDialogOpen(false);
    router.push("/expenses");
    router.refresh();
  } catch (error) {
    console.error("Unexpected delete error:", error);
    setMessage("קרתה שגיאה לא צפויה בעת המחיקה.");
  } finally {
    setDeleting(false);
  }
};

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-teal-400 via-cyan-500 to-teal-600 pb-24">
        <div className="mx-auto max-w-[440px] px-4 py-6">
          <div className="rounded-[2rem] border border-white/35 bg-white/92 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <p className="text-sm font-medium text-slate-500">טוען...</p>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-400 via-cyan-500 to-teal-600 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.push("/expenses")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90"
          >
            <ArrowRight size={16} />
            חזרה להוצאות
          </button>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <h1 className="text-3xl font-bold text-slate-900">עריכת הוצאה</h1>
            <p className="mt-1 text-sm text-slate-500">עדכן או מחק הוצאה קיימת</p>
          </section>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              סכום
            </label>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-semibold text-slate-500">₪</span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-40 border-b-2 border-slate-200 bg-transparent px-2 py-2 text-center text-3xl font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              קטגוריה
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((category) => {
                const isActive = selectedCategoryId === category.id;
                const visual = getCategoryVisual(category.name);
                const Icon = visual.icon;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm transition ${
                      isActive ? visual.active : visual.idle
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon size={16} />
                      <span>{category.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              תיאור
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="על מה ההוצאה?"
              className="min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-400"
            />
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              הערות
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות"
              className="min-h-[90px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-400"
            />
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              תאריך
            </label>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-transparent text-base text-slate-800 outline-none"
                required
              />
              <CalendarDays size={18} className="text-slate-500" />
            </div>
          </section>

          {message && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-500 px-4 py-4 text-base font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? "שומר..." : "שמור שינויים"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/expenses")}
              className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-medium text-slate-700"
            >
              ביטול
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-base font-semibold text-red-600 disabled:opacity-50"
          >
            <Trash2 size={18} />
            {deleting ? "מוחק..." : "מחק הוצאה"}
          </button>
        </form>

        <DeleteExpenseDialog
          open={deleteDialogOpen}
          title={title || "הוצאה"}
          loading={deleting}
          onCancel={() => {
            if (!deleting) setDeleteDialogOpen(false);
          }}
          onConfirm={handleDelete}
        />
      </div>

      <BottomNav />
    </main>
  );
}