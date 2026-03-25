"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "../../components/bottom-nav";

type Category = {
  id: string;
  name: string;
};

type HouseholdMember = {
  household_id: string;
};

type ExpenseTemplateRow = {
  id: string;
  title: string;
  default_amount: number | null;
  sort_order: number;
  is_active: boolean;
  category_id: string;
  categories: {
    name: string;
  }[] | null;
};

const categoryOrder = [
  "אוכל",
  "הוצאות בית",
  "חשבונות",
  "בילויים",
  "תחבורה",
  "אחר",
];

export default function ExpenseTemplatesPage() {
  const supabase = createClient();
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<ExpenseTemplateRow[]>([]);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        setMessage("");

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

        if (memberError || !memberData?.household_id) {
          setMessage("לא נמצא משק בית למשתמש.");
          return;
        }

        setHouseholdId(memberData.household_id);

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
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

        if (sortedCategories.length > 0) {
          setCategoryId(sortedCategories[0].id);
        }

        const { data: templatesData, error: templatesError } = await supabase
          .from("expense_templates")
          .select(`
            id,
            title,
            default_amount,
            sort_order,
            is_active,
            category_id,
            categories (
              name
            )
          `)
          .eq("household_id", memberData.household_id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (templatesError) {
          setMessage("שגיאה בטעינת התבניות.");
          return;
        }

        setTemplates((templatesData as ExpenseTemplateRow[]) || []);
      } catch {
        setMessage("קרתה שגיאה לא צפויה.");
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates]
  );

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !householdId) {
      setMessage("חסרים נתוני משתמש.");
      return;
    }

    if (!title.trim()) {
      setMessage("יש להזין שם תבנית.");
      return;
    }

    if (!categoryId) {
      setMessage("יש לבחור קטגוריה.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const nextSortOrder = templates.length;

      const { error } = await supabase.from("expense_templates").insert({
        household_id: householdId,
        user_id: userId,
        title: title.trim(),
        category_id: categoryId,
        default_amount: defaultAmount ? Number(defaultAmount) : null,
        is_active: true,
        sort_order: nextSortOrder,
      });

      if (error) {
        setMessage("שגיאה ביצירת תבנית.");
        return;
      }

      setTitle("");
      setDefaultAmount("");

      const { data: templatesData, error: reloadError } = await supabase
        .from("expense_templates")
        .select(`
          id,
          title,
          default_amount,
          sort_order,
          is_active,
          category_id,
          categories (
            name
          )
        `)
        .eq("household_id", householdId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (reloadError) {
        setMessage("התבנית נוספה, אבל הייתה בעיה ברענון הרשימה.");
        return;
      }

      setTemplates((templatesData as ExpenseTemplateRow[]) || []);
    } catch {
      setMessage("קרתה שגיאה לא צפויה בעת שמירה.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!householdId) return;

    try {
      setMessage("");

      const { error } = await supabase
        .from("expense_templates")
        .delete()
        .eq("id", templateId);

      if (error) {
        setMessage("שגיאה במחיקת תבנית.");
        return;
      }

      setTemplates((prev) => prev.filter((item) => item.id !== templateId));
    } catch {
      setMessage("קרתה שגיאה לא צפויה בעת המחיקה.");
    }
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
          <h1 className="text-3xl font-bold text-slate-900">ניהול תבניות</h1>
          <p className="mt-1 text-sm text-slate-500">
            צור תבניות מהירות להוצאות קבועות
          </p>
        </div>

        <form
          onSubmit={handleAddTemplate}
          className="mb-6 space-y-4 rounded-3xl bg-white p-4 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-500">
              שם תבנית
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: סופר, דלק, חשמל"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-500">
              קטגוריה
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            >
              <option value="">בחר קטגוריה</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-500">
              סכום ברירת מחדל (אופציונלי)
            </label>
            <input
              type="number"
              step="0.01"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="למשל 250"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "שומר..." : "הוסף תבנית"}
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            תבניות פעילות ({activeTemplates.length})
          </h2>

          {templates.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500 shadow-sm">
              עדיין אין תבניות.
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {template.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {template.categories?.[0]?.name || "ללא קטגוריה"}
                      {template.default_amount != null
                        ? ` · ₪${Number(template.default_amount).toFixed(0)}`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {message && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}