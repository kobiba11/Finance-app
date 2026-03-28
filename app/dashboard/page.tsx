import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "../components/app-shell";
import AppCard from "../components/app-card";
import BottomNav from "../components/bottom-nav";
import LatestExpensesList from "../components/latest-expenses-list";
import AttentionSection from "../components/attention-section";
import BudgetOverviewCard from "../components/budget-overview-card";
import {
  getRenewingSubscriptions,
  getExpiringVouchers,
  getExpiringCredits,
} from "src/lib/attention-items";
import { getCurrencySymbol } from "@/lib/currency";
import {
  Plus,
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  PartyPopper,
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

type HouseholdRow = {
  id: string;
  name: string;
  base_currency: string;
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

function getCategoryColors(name: string) {
  switch (name) {
    case "אוכל":
      return { dot: "#10b981" };
    case "חשבונות":
      return { dot: "#3b82f6" };
    case "תחבורה":
      return { dot: "#f97316" };
    case "הוצאות בית":
      return { dot: "#6366f1" };
    case "בילויים":
      return { dot: "#ec4899" };
    default:
      return { dot: "#94a3b8" };
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

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${monthNumber}-01`;
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

  const monthStartStr = getMonthKey(monthStart);
  const nextMonthStartStr = getMonthKey(nextMonthStart);
  const prevMonthStartStr = getMonthKey(prevMonthStart);

  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<HouseholdMember>();

  const { data: profile } = await supabase
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
        <main className="mx-auto w-full max-w-[430px] px-4 pb-20 pt-6">
          <div className="mb-4 rounded-full bg-white/85 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl" />

          <AppCard className="mb-4 !p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">ברוך הבא</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  שלום, {displayName} 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  לא נמצא משק בית למשתמש הזה
                </p>
              </div>

              <Link
                href="/expenses/new"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Plus size={16} />
                הוסף
              </Link>
            </div>
          </AppCard>

          <AppCard>
            <p className="text-sm text-slate-600">
              צריך קודם לשייך את המשתמש שלך ל־household_members כדי שהדאשבורד
              יוכל להציג נתונים.
            </p>
          </AppCard>
        </main>

        <BottomNav />
      </AppShell>
    );
  }

  const householdId = membership.household_id;

  const [
    householdResult,
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
      .from("households")
      .select("id, name, base_currency")
      .eq("id", householdId)
      .limit(1)
      .maybeSingle<HouseholdRow>(),

    supabase
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
      .select(`
        id,
        title,
        default_amount,
        sort_order,
        category_id,
        categories (
          name,
          icon
        )
      `)
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const household = householdResult.data ?? null;

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
    ((expenseTemplatesResult.data ?? []) as ExpenseTemplateRow[]) ?? [];

  const currencySymbol = getCurrencySymbol(
    household?.base_currency ?? budget?.currency ?? "ILS"
  );

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
      <main className="mx-auto w-full max-w-[430px] px-4 pb-1 pt-6">
        <AppCard className="mb-4 !p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="mt-1 truncate text-2xl font-bold text-slate-900">
                שלום, {displayName} 👋
              </h1>
              <p className="mt-1 text-sm text-slate-500">{getMonthName(now)}</p>
            </div>

            <Link
              href="/expenses/new"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Plus size={16} />
              הוסף הוצאה
            </Link>
          </div>
        </AppCard>

        <div className="mb-4">
          <AttentionSection items={attentionItems} />
        </div>

        <AppCard className="mb-4 !p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">הוספה מהירה</h2>
            <span className="text-sm">⚡</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {quickActions.map(({ label, icon: Icon, category, title }) => (
              <Link
                key={label}
                href={{
                  pathname: "/expenses/new",
                  query: { category, title },
                }}
                className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white/80 px-2 py-3 text-center transition hover:bg-white"
              >
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Icon size={15} />
                </div>

                <span className="text-[11px] font-medium leading-4 text-slate-700">
                  {label}
                </span>
              </Link>
            ))}
          </div>

          <details className="mt-3 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50/70">
            <summary className="cursor-pointer list-none px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  תבניות מהירות
                </span>
                <span className="text-slate-400">⌄</span>
              </div>
            </summary>

            <div className="px-3 pb-3">
              <Link
                href="/settings/templates"
                className="mb-2 inline-block text-xs font-medium text-emerald-600"
              >
                נהל תבניות
              </Link>

              {expenseTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
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
                      className="rounded-[1rem] border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{template.title}</span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {template.categories?.[0]?.name ?? "ללא קטגוריה"}
                        </span>
                      </div>

                      {template.default_amount != null ? (
                        <p className="mt-1 text-[11px] text-emerald-600">
                          {currencySymbol}
                          {Number(template.default_amount).toFixed(0)}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1rem] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
                  עדיין אין תבניות. אפשר ליצור דרך "נהל תבניות".
                </div>
              )}
            </div>
          </details>
        </AppCard>

        <div className="mb-4">
          <BudgetOverviewCard
            currencySymbol={currencySymbol}
            budgetAmount={budgetAmount}
            currentMonthTotal={currentMonthTotal}
            remaining={remaining}
            overBudget={overBudget}
            usagePercent={usagePercent}
            daysLeft={daysLeft}
            recommendedDaily={recommendedDaily}
          />
        </div>

        <section className="mb-4 grid grid-cols-3 gap-2">
          <AppCard className="!rounded-[1.5rem] !p-3 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <CalendarDays size={16} />
            </div>
            <p className="text-xl font-bold text-slate-900">
              {currentMonthExpenses.length}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">הוצאות החודש</p>
          </AppCard>

          <AppCard className="!rounded-[1.5rem] !p-3 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <TrendingDown size={16} />
            </div>
            <p className="text-xl font-bold text-slate-900">
              {previousMonthTotal > 0 ? `${diffPercent.toFixed(0)}%` : "—"}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              לעומת חודש קודם
            </p>
          </AppCard>

          <AppCard className="!rounded-[1.5rem] !p-3 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign size={16} />
            </div>
            <p className="text-xl font-bold text-slate-900">
              {currencySymbol}
              {currentMonthTotal.toFixed(0)}
            </p>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">החודש</p>
          </AppCard>
        </section>

        <AppCard className="mb-4 !p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">הוצאות לפי קטגוריה</h2>
          </div>

          {groupedByCategory.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full shadow-inner"
                style={{ background: donutStyle }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-center shadow-sm">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {groupedByCategory.length}
                    <br />
                    קט׳
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2">
                {groupedByCategory.slice(0, 4).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-white/70 px-3 py-2.5 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.dot }}
                      />
                      <span className="truncate text-slate-700">{item.name}</span>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {currencySymbol}
                      {item.amount.toFixed(0)} · {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">עדיין אין הוצאות החודש</p>
          )}
        </AppCard>

        <AppCard className="mb-2 !p-3.5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">הוצאות אחרונות</h2>
          <LatestExpensesList expenses={latestExpenses} />
        </AppCard>
      </main>

      <BottomNav />
    </AppShell>
  );
}