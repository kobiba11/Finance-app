"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../components/bottom-nav";
import {
  ArrowRight,
  Camera,
  FileText,
  CalendarDays,
  UtensilsCrossed,
  Receipt,
  Home,
  Car,
  PartyPopper,
  CircleEllipsis,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type HouseholdMember = {
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
        active:
          "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md",
        idle: "border-slate-200 bg-white text-slate-700",
      };
    case "הוצאות בית":
      return {
        icon: Home,
        active:
          "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md",
        idle: "border-slate-200 bg-white text-slate-700",
      };
    case "חשבונות":
      return {
        icon: Receipt,
        active:
          "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md",
        idle: "border-slate-200 bg-white text-slate-700",
      };
    case "בילויים":
      return {
        icon: PartyPopper,
        active:
          "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md",
        idle: "border-slate-200 bg-white text-slate-700",
      };
    case "תחבורה":
      return {
        icon: Car,
        active:
          "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md",
        idle: "border-slate-200 bg-white text-slate-700",
      };
    default:
      return {
        icon: CircleEllipsis,
        active:
          "border-transparent bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md",
        idle: "border-slate-200 bg-white text-slate-700",
      };
  }
}

export default function NewExpensePageClient() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currency] = useState("ILS");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const { data: memberData, error: memberError } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle<HouseholdMember>();

        if (memberError) {
          setMessage("שגיאה בטעינת משק הבית.");
          return;
        }

        if (!memberData?.household_id) {
          setMessage("לא נמצא משק בית למשתמש הזה.");
          return;
        }

        setHouseholdId(memberData.household_id);

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

        const categoryFromUrl = searchParams.get("category");
        const titleFromUrl = searchParams.get("title");
        const amountFromUrl = searchParams.get("amount");

        if (titleFromUrl) {
          setTitle(titleFromUrl);
        }

        if (amountFromUrl) {
          setAmount(amountFromUrl);
        }

        if (categoryFromUrl) {
          const matchedCategory = sortedCategories.find(
            (c) => c.name === categoryFromUrl
          );

          if (matchedCategory) {
            setSelectedCategoryId(matchedCategory.id);
          } else {
            const foodCategory = sortedCategories.find((c) => c.name === "אוכל");
            if (foodCategory) {
              setSelectedCategoryId(foodCategory.id);
            }
          }
        } else {
          const foodCategory = sortedCategories.find((c) => c.name === "אוכל");
          if (foodCategory) {
            setSelectedCategoryId(foodCategory.id);
          }
        }
      } catch {
        setMessage("קרתה שגיאה לא צפויה.");
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [router, searchParams, supabase]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!householdId || !userId) {
      setMessage("חסרים נתוני משתמש או משק בית.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage("יש להזין סכום תקין.");
      return;
    }

    if (!selectedCategoryId) {
      setMessage("יש לבחור קטגוריה.");
      return;
    }

    const finalTitle =
      title.trim() || `הוצאה - ${selectedCategory?.name || "ללא קטגוריה"}`;

    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.from("expenses").insert({
        household_id: householdId,
        user_id: userId,
        category_id: selectedCategoryId,
        title: finalTitle,
        amount: Number(amount),
        currency,
        notes: notes.trim() || null,
        expense_date: expenseDate,
        is_favorite: isFavorite,
      });

      if (error) {
        setMessage("שגיאה בשמירת ההוצאה.");
        return;
      }

      router.push("/expenses");
    } catch {
      setMessage("קרתה שגיאה לא צפויה בעת השמירה.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/expenses");
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-600 pb-24">
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
    <main className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-600 pb-24">
      <div className="mx-auto max-w-[440px] px-4 py-6">
        <section className="mb-4 rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              <ArrowRight size={18} />
            </button>

            <div className="min-w-0 text-right">
              <p className="text-xs font-medium text-slate-500">הוספה חדשה</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                הוצאה חדשה
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                עקוב אחרי ההוצאות שלך
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              סכום
            </label>

            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-semibold text-emerald-500">₪</span>
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

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
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
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
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

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              תיאור
            </label>

            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="על מה ההוצאה?"
              className="min-h-[110px] w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 outline-none placeholder:text-slate-400"
            />
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-500">
                הערות
              </label>

              <button
                type="button"
                onClick={() => setIsFavorite((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isFavorite
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <FileText size={14} />
                {isFavorite ? "סומן כמועדף" : "סמן כמועדף"}
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערה אישית על ההוצאה..."
              className="min-h-[90px] w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              תאריך
            </label>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-transparent text-base text-slate-800 outline-none"
                  required
                />
                <CalendarDays size={18} className="text-slate-500" />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/35 bg-white/92 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-500">
              קבלה (אופציונלי)
            </label>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-6 text-sm font-medium text-emerald-700"
            >
              <Camera size={18} />
              סרוק קבלה / מילוי אוטומטי
            </button>
          </section>

          {message && (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pb-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(16,185,129,0.28)] disabled:opacity-50"
            >
              {loading ? "מוסיף..." : "הוסף הוצאה"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-medium text-slate-700"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>

      <BottomNav />
    </main>
  );
}