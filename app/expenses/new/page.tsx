"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../components/bottom-nav";
import {
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
        active: "bg-emerald-500 text-white",
        idle: "bg-white text-slate-700",
      };
    case "הוצאות בית":
      return {
        icon: Home,
        active: "bg-emerald-500 text-white",
        idle: "bg-white text-slate-700",
      };
    case "חשבונות":
      return {
        icon: Receipt,
        active: "bg-emerald-500 text-white",
        idle: "bg-white text-slate-700",
      };
    case "בילויים":
      return {
        icon: PartyPopper,
        active: "bg-emerald-500 text-white",
        idle: "bg-white text-slate-700",
      };
    case "תחבורה":
      return {
        icon: Car,
        active: "bg-emerald-500 text-white",
        idle: "bg-white text-slate-700",
      };
    default:
      return {
        icon: CircleEllipsis,
        active: "bg-emerald-500 text-white",
        idle: "bg-white text-slate-700",
      };
  }
}

export default function NewExpensePage() {
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

        if (titleFromUrl) {
          setTitle(titleFromUrl);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">הוצאה חדשה</h1>
          <p className="mt-1 text-sm text-slate-500">עקוב אחרי ההוצאות שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <label className="mb-2 block text-sm text-slate-500">סכום</label>
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

          <section>
            <label className="mb-3 block text-sm text-slate-500">קטגוריה</label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => {
                const isActive = selectedCategoryId === category.id;
                const visual = getCategoryVisual(category.name);
                const Icon = visual.icon;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-sm transition ${
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

          <section>
            <label className="mb-3 block text-sm text-slate-500">תיאור</label>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="על מה ההוצאה?"
                className="min-h-[110px] w-full resize-none bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsFavorite((prev) => !prev)}
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <FileText size={16} />
              <span>{isFavorite ? "הערה אישית נוספה" : "הוסף הערה אישית"}</span>
            </button>
          </div>

          <section>
            <label className="mb-3 block text-sm text-slate-500">תאריך</label>
            <div className="rounded-3xl bg-white px-4 py-4 shadow-sm">
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

          <section>
            <label className="mb-3 block text-sm text-slate-500">
              קבלה (אופציונלי)
            </label>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500"
            >
              <Camera size={18} />
              סרוק קבלה / מילוי אוטומטי
            </button>
          </section>

          {message && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-emerald-500 px-4 py-4 text-base font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {loading ? "מוסיף..." : "הוסף הוצאה"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-2xl bg-slate-100 px-4 py-4 text-base font-medium text-slate-700"
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