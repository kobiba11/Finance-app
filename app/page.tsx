import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "./components/app-shell";
import AppCard from "./components/app-card";
import PageHeader from "./components/page-header";
import BottomNav from "./components/bottom-nav";
import LatestExpensesList from "./components/latest-expenses-list";
import AttentionSection from "./components/attention-section";
import ExpensesList from "./components/expenses-list";
import {
  getRenewingSubscriptions,
  getExpiringVouchers,
  getExpiringCredits,
} from "src/lib/attention-items";
import {
  Plus,
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  PartyPopper,
  CircleEllipsis,
  CalendarDays,
  TrendingDown,
  DollarSign,
} from "lucide-react";

type HouseholdMember = {
  household_id: string;
};

type ExpenseRow = {
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

type BudgetRow = {
  amount: number;
  currency: string;
};

type ProfileRow = {
  full_name: string | null;
};

type SubscriptionAttentionRow = {
  id: string;
  name: string;
  renewal_date: string | null;
  status: string | null;
};

type VoucherAttentionRow = {
  id: string;
  name: string;
  expiry_date: string | null;
  status: string | null;
};

type CreditAttentionRow = {
  id: string;
  company: string;
  expiry_date: string | null;
  status: string | null;
};

type ExpenseTemplateRow = {
  id: string;
  title: string;
  default_amount: number | null;
  sort_order: number;
  category_id: string;
  categories: {
    name: string;
    icon: string | null;
  }[] | null;
};

function getMonthName(date: Date) {
  return date.toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });
}

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
      return { badge: "bg-emerald-100 text-emerald-600", dot: "#10b981" };
    case "חשבונות":
      return { badge: "bg-blue-100 text-blue-600", dot: "#3b82f6" };
    case "תחבורה":
      return { badge: "bg-orange-100 text-orange-600", dot: "#f97316" };
    case "הוצאות בית":
      return { badge: "bg-indigo-100 text-indigo-600", dot: "#6366f1" };
    case "בילויים":
      return { badge: "bg-pink-100 text-pink-600", dot: "#ec4899" };
    default:
      return { badge: "bg-slate-100 text-slate-600", dot: "#94a3b8" };
  }
}

function buildConicGradient(
  items: { amount: number; color: string }[],
  total: number
) {
  if (!items.length || total <= 0) {
    return "conic-gradient(#e2e8f0 0 100%)";
  }

  let current = 0;

  const segments = items.map((item) => {
    const start = current;
    const part = (item.amount / total) * 100;
    current += part;
    return `${item.color} ${start}% ${current}%`;
  });

  if (current < 100) {
    segments.push(`#e2e8f0 ${current}% 100%`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthStart = new Date(currentYear, currentMonth, 1);
  const nextMonthStart = new Date(currentYear, currentMonth + 1, 1);
  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);

  const monthStartStr = monthStart.toISOString().split("T")[0];
  const nextMonthStartStr = nextMonthStart.toISOString().split("T")[0];
  const prevMonthStartStr = prevMonthStart.toISOString().split("T")[0];

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<HouseholdMember>();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle<ProfileRow>();

  const fullNameFromAuth =
    typeof user.user_metadata?.["full_name"] === "string"
      ? user.user_metadata["full_name"]
      : "";

  const displayName =
    profile?.full_name?.trim() ||
    fullNameFromAuth ||
    user.email?.split("@")[0] ||
    "משתמש";

  if (membershipError || !membership?.household_id) {
    return (
      <AppShell>
        <PageHeader
          title={`שלום, ${displayName} 👋`}
          subtitle="לא נמצא משק בית למשתמש הזה"
          action={
            <Link
              href="/expenses/new"
              className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              <Plus size={18} />
              הוסף
            </Link>
          }
        />

        <AppCard>
          <p className="mb-2 text-sm text-slate-500">
            צריך קודם לשייך את המשתמש שלך ל־household_members כדי שהדאשבורד יוכל
            להציג נתונים.
          </p>

          {membershipError ? (
            <p className="text-xs text-red-600">
              שגיאת מערכת: {membershipError.message}
            </p>
          ) : null}

          {profileError ? (
            <p className="mt-2 text-xs text-red-600">
              שגיאת פרופיל: {profileError.message}
            </p>
          ) : null}

          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            <p>user.id: {user.id}</p>
            <p>full_name מה-auth: {fullNameFromAuth || "ריק"}</p>
            <p>full_name מה-profile: {profile?.full_name || "ריק"}</p>
            <p>household_id: {membership?.household_id || "לא נמצא"}</p>
          </div>
        </AppCard>

        <BottomNav />
      </AppShell>
    );
  }

  const householdId = membership.household_id;

  const [
    currentMonthExpensesResult,
    previousMonthExpensesResult,
    latestExpensesResult,
    budgetResult,
    subscriptionsResult,
    vouchersResult,
    creditsResult,
    expenseTemplatesResult,
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        `
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
      `
      )
      .eq("household_id", householdId)
      .gte("expense_date", monthStartStr)
      .lt("expense_date", nextMonthStartStr)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("expenses")
      .select("id, amount")
      .eq("household_id", householdId)
      .gte("expense_date", prevMonthStartStr)
      .lt("expense_date", monthStartStr),

    supabase
      .from("expenses")
      .select(
        `
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
      `
      )
      .eq("household_id", householdId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),

    supabase
      .from("monthly_budgets")
      .select("amount, currency")
      .eq("household_id", householdId)
      .eq("month", monthStartStr)
      .limit(1)
      .maybeSingle<BudgetRow>(),

    supabase
      .from("subscriptions")
      .select("id, name, renewal_date, status")
      .eq("household_id", householdId),

    supabase
      .from("vouchers")
      .select("id, name, expiry_date, status")
      .eq("household_id", householdId),

    supabase
      .from("credits")
      .select("id, company, expiry_date, status")
      .eq("household_id", householdId),

    supabase
      .from("expense_templates")
      .select(
        `
        id,
        title,
        default_amount,
        sort_order,
        category_id,
        categories (
          name,
          icon
        )
      `
      )
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const currentMonthExpenses =
    (currentMonthExpensesResult.data as ExpenseRow[] | null) ?? [];
  const previousMonthExpenses = previousMonthExpensesResult.data ?? [];
  const latestExpenses =
    (latestExpensesResult.data as ExpenseRow[] | null) ?? [];
  const budget = budgetResult.data ?? null;

  const subscriptions =
    (subscriptionsResult.data as SubscriptionAttentionRow[] | null) ?? [];
  const vouchers = (vouchersResult.data as VoucherAttentionRow[] | null) ?? [];
  const credits = (creditsResult.data as CreditAttentionRow[] | null) ?? [];
  const expenseTemplates =
    ((expenseTemplatesResult.data ?? []) as unknown as ExpenseTemplateRow[]) ??
    [];

  const renewingSubscriptions = getRenewingSubscriptions(subscriptions).map(
    (item) => ({
      id: item.id,
      title: item.name,
      subtitle: "מנוי מתחדש בקרוב",
      type: "subscription" as const,
      dateLabel: item.renewal_date ?? "ללא תאריך",
    })
  );

  const expiringVouchers = getExpiringVouchers(vouchers).map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: "שובר שעומד לפוג",
    type: "voucher" as const,
    dateLabel: item.expiry_date ?? "ללא תוקף",
  }));

  const expiringCredits = getExpiringCredits(credits).map((item) => ({
    id: item.id,
    title: item.company,
    subtitle: "זיכוי שעומד לפוג",
    type: "credit" as const,
    dateLabel: item.expiry_date ?? "ללא תוקף",
  }));

  const attentionItems = [
    ...renewingSubscriptions,
    ...expiringVouchers,
    ...expiringCredits,
  ].slice(0, 5);

  const currentMonthTotal = currentMonthExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const previousMonthTotal = previousMonthExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const budgetAmount = Number(budget?.amount || 0);
  const remaining = Math.max(budgetAmount - currentMonthTotal, 0);
  const overBudget = Math.max(currentMonthTotal - budgetAmount, 0);

  const usagePercent =
    budgetAmount > 0
      ? Math.min((currentMonthTotal / budgetAmount) * 100, 100)
      : 0;

  const diffPercent =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = Math.max(daysInMonth - today, 0);

  const recommendedDaily =
    daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;

  const groupedByCategoryMap = new Map<string, number>();

  for (const expense of currentMonthExpenses) {
    const name = expense.categories?.name ?? "אחר";
    groupedByCategoryMap.set(
      name,
      (groupedByCategoryMap.get(name) || 0) + Number(expense.amount || 0)
    );
  }

  const groupedByCategory = Array.from(groupedByCategoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage:
        currentMonthTotal > 0 ? (amount / currentMonthTotal) * 100 : 0,
      ...getCategoryColors(name),
    }))
    .sort((a, b) => b.amount - a.amount);

  const topChartCategories = groupedByCategory.slice(0, 4).map((item) => ({
    amount: item.amount,
    color: item.dot,
  }));

  const donutStyle = buildConicGradient(topChartCategories, currentMonthTotal);

  const quickActions = [
    { label: "אוכל", icon: UtensilsCrossed, category: "אוכל", title: "סופר" },
    { label: "תחבורה", icon: Car, category: "תחבורה", title: "דלק" },
    { label: "חשבונות", icon: Receipt, category: "חשבונות", title: "חשבון" },
    {
      label: "הוצאות בית",
      icon: Home,
      category: "הוצאות בית",
      title: "קניות לבית",
    },
    { label: "בילויים", icon: PartyPopper, category: "בילויים", title: "בילוי" },
  ];

  return (
    <AppShell>
      <PageHeader
        title={`שלום, ${displayName} 👋`}
        subtitle={getMonthName(now)}
        action={
          <Link
            href="/expenses/new"
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <Plus size={18} />
            הוסף
          </Link>
        }
      />

      <AttentionSection items={attentionItems} />

      <AppCard className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">הוספה מהירה</h2>
          <span className="text-emerald-500">⚡</span>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {quickActions.map(({ label, icon: Icon, category, title }) => (
            <Link
              key={label}
              href={{
                pathname: "/expenses/new",
                query: { category, title },
              }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-2 py-4 transition hover:bg-slate-100"
            >
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Icon size={18} />
              </div>
              <span className="text-[11px] font-medium text-slate-700">
                {label}
              </span>
            </Link>
          ))}
        </div>

        <details className="mt-4 rounded-2xl bg-slate-50">
          <summary className="cursor-pointer list-none px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                תבניות מהירות
              </span>
              <span className="text-slate-400">⌄</span>
            </div>
          </summary>

          <div className="px-4 pb-4">
            <Link
              href="/settings/templates"
              className="mb-3 inline-block text-xs font-medium text-emerald-600"
            >
              נהל תבניות
            </Link>

            {expenseTemplates.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {expenseTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={{
                      pathname: "/expenses/new",
                      query: {
                        category: template.categories?.[0]?.name ?? "",
                        title: template.title,
                        amount:
                          template.default_amount != null
                            ? String(template.default_amount)
                            : "",
                      },
                    }}
                    className="rounded-2xl bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{template.title}</span>
                      <span className="text-xs text-slate-400">
                        {template.categories?.[0]?.name ?? "ללא קטגוריה"}
                      </span>
                    </div>

                    {template.default_amount != null ? (
                      <p className="mt-2 text-xs text-emerald-600">
                        ₪{Number(template.default_amount).toFixed(0)}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500">
                עדיין אין תבניות. אפשר ליצור דרך "נהל תבניות".
              </div>
            )}
          </div>
        </details>
      </AppCard>

      <AppCard className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">תקציב חודשי</h2>
          <p className="text-lg font-bold text-emerald-600">
            {budgetAmount > 0
              ? `נותר ₪${remaining.toFixed(0)}`
              : "לא הוגדר תקציב"}
          </p>
        </div>

        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              usagePercent >= 100 ? "bg-red-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            ₪{currentMonthTotal.toFixed(0)} הוצאות
          </span>
          <span
            className={`font-semibold ${
              usagePercent >= 100 ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {budgetAmount > 0
              ? `${usagePercent.toFixed(0)}% נוצל`
              : "ללא תקציב"}
          </span>
          <span className="text-slate-500">
            {budgetAmount > 0 ? `₪${budgetAmount.toFixed(0)} תקציב` : "—"}
          </span>
        </div>

        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            overBudget > 0
              ? "border border-red-100 bg-red-50 text-red-600"
              : "border border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {budgetAmount <= 0
            ? "עדיין לא הוגדר תקציב חודשי במערכת"
            : overBudget > 0
            ? `חריגה של ₪${overBudget.toFixed(0)} מהתקציב`
            : `נותרו ${daysLeft} ימים - מומלץ להוציא עד ₪${recommendedDaily.toFixed(
                0
              )} / יום`}
        </div>
      </AppCard>

      <section className="mb-5 grid grid-cols-3 gap-3">
        <AppCard className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <CalendarDays size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {currentMonthExpenses.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">הוצאות החודש</p>
        </AppCard>

        <AppCard className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <TrendingDown size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {previousMonthTotal > 0 ? `${diffPercent.toFixed(0)}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">לעומת חודש קודם</p>
        </AppCard>

        <AppCard className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <DollarSign size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ₪{currentMonthTotal.toFixed(0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">החודש</p>
        </AppCard>
      </section>

      <AppCard className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            הוצאות לפי קטגוריה
          </h2>
        </div>

        {groupedByCategory.length > 0 ? (
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-32 w-32 items-center justify-center rounded-full"
              style={{ background: donutStyle }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-center">
                <span className="text-xs font-semibold text-slate-500">
                  {groupedByCategory.length}
                  <br />
                  קט׳
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {groupedByCategory.slice(0, 4).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.dot }}
                    />
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    ₪{item.amount.toFixed(0)} · {item.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">עדיין אין הוצאות החודש</p>
        )}
      </AppCard>

<AppCard className="mb-5">
  <h2 className="mb-3 text-base font-bold text-slate-900">
    הוצאות אחרונות
  </h2>

  <LatestExpensesList expenses={latestExpenses} />
</AppCard>

      <BottomNav />
    </AppShell>
  );
}