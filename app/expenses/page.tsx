"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../components/bottom-nav";
import ExpensesList from "../components/expenses-list";
import {
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  X,
} from "lucide-react";

type Expense = {
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

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

function getMonthValue(dateString: string) {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const monthNames = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];
  return `${monthNames[Number(month) - 1]} ${year}`;
}

export default function ExpensesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [period, setPeriod] = useState<"month" | "prevMonth" | "year" | "all">(
    "month"
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = "/login";
          return;
        }

        const { data: expensesData, error: expensesError } = await supabase
          .from("expenses")
          .select(`
            id,
            title,
            amount,
            currency,
            expense_date,
            category_id,
            categories (
              name,
              icon
            )
          `)
          .order("expense_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (expensesError) {
          setMessage("שגיאה בטעינת ההוצאות.");
          return;
        }

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, icon")
          .order("name", { ascending: true });

        if (categoriesError) {
          setMessage("שגיאה בטעינת הקטגוריות.");
          return;
        }

        const mappedExpenses = (expensesData || []) as unknown as Expense[];
        setExpenses(mappedExpenses);
        setCategories(categoriesData || []);

        if (mappedExpenses.length > 0) {
          setSelectedMonth(getMonthValue(mappedExpenses[0].expense_date));
        } else {
          setSelectedMonth(getMonthValue(new Date().toISOString()));
        }
      } catch {
        setMessage("קרתה שגיאה לא צפויה.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(expenses.map((expense) => getMonthValue(expense.expense_date)))
    );
    return uniqueMonths.sort((a, b) => (a < b ? 1 : -1));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let data = [...expenses];

    const now = new Date();

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prevMonthDate.getFullYear()}-${String(
      prevMonthDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (period === "month" && selectedMonth) {
      data = data.filter(
        (expense) => getMonthValue(expense.expense_date) === selectedMonth
      );
    }

    if (period === "prevMonth") {
      data = data.filter(
        (expense) => getMonthValue(expense.expense_date) === previousMonth
      );
    }

    if (period === "year") {
      data = data.filter(
        (expense) =>
          new Date(expense.expense_date).getFullYear() === now.getFullYear()
      );
    }

    if (search.trim()) {
      const value = search.trim().toLowerCase();
      data = data.filter((expense) => {
        const title = expense.title?.toLowerCase() || "";
        const category = expense.categories?.name?.toLowerCase() || "";
        return title.includes(value) || category.includes(value);
      });
    }

    if (selectedCategory) {
      data = data.filter((expense) => expense.category_id === selectedCategory);
    }

    if (fromDate) {
      data = data.filter((expense) => expense.expense_date >= fromDate);
    }

    if (toDate) {
      data = data.filter((expense) => expense.expense_date <= toDate);
    }

    return data;
  }, [expenses, period, selectedMonth, search, selectedCategory, fromDate, toDate]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const exportToCsv = () => {
    if (!filteredExpenses.length) return;

    const rows = [
      ["תיאור", "קטגוריה", "סכום", "מטבע", "תאריך"],
      ...filteredExpenses.map((expense) => [
        expense.title,
        expense.categories?.name || "ללא קטגוריה",
        String(expense.amount),
        expense.currency,
        expense.expense_date,
      ]),
    ];

    const csvContent = "\uFEFF" + rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setFromDate("");
    setToDate("");
    setPeriod("month");
    if (monthOptions.length > 0) {
      setSelectedMonth(monthOptions[0]);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7f8] pb-24">
        <div className="mx-auto max-w-[440px] px-4 py-6">
          <p className="text-center text-slate-500">טוען...</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f8] pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">הוצאות</h1>
            <p className="mt-1 text-sm text-slate-500">
              סה״כ ₪{totalAmount.toFixed(2)}
            </p>
          </div>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm"
          >
            CSV
            <Download size={16} />
          </button>
        </div>

        <div className="mb-4 flex gap-3">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-sm"
          >
            <SlidersHorizontal size={18} className="text-white" />
          </button>

          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי תיאור, קטגוריה..."
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setPeriod("month")}
            className={`rounded-full px-4 py-2 text-sm ${
              period === "month"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            החודש
          </button>

          <button
            onClick={() => setPeriod("prevMonth")}
            className={`rounded-full px-4 py-2 text-sm ${
              period === "prevMonth"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            חודש קודם
          </button>

          <button
            onClick={() => setPeriod("year")}
            className={`rounded-full px-4 py-2 text-sm ${
              period === "year"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            השנה
          </button>

          <button
            onClick={() => setPeriod("all")}
            className={`rounded-full px-4 py-2 text-sm ${
              period === "all"
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            הכל
          </button>
        </div>

        {showFilters && (
          <div className="mb-5 rounded-3xl bg-white p-4 shadow-sm">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPeriod("month");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {getMonthLabel(month)}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">כל הקטגוריות</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button onClick={clearFilters} className="text-sm text-red-500">
                נקה
              </button>

              <button
                onClick={() => setShowFilters(false)}
                className="flex items-center gap-1 text-sm text-slate-500"
              >
                <X size={14} />
                סגור
              </button>
            </div>
          </div>
        )}

        <p className="mb-4 text-center text-xs text-slate-400">
          החלק שמאלה למחיקה · ימינה לעריכה
        </p>

        <ExpensesList
          expenses={filteredExpenses}
          emptyText="לא נמצאו הוצאות לפי הסינון שבחרת"
        />

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
            {message}
          </div>
        )}

        <Link
          href="/expenses/new"
          className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <Plus size={18} />
          הוצאה חדשה
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}