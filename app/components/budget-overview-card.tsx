"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Flame } from "lucide-react";

type BudgetOverviewCardProps = {
  currencySymbol: string;
  budgetAmount: number;
  currentMonthTotal: number;
  remaining: number;
  overBudget: number;
  usagePercent: number;
  daysLeft: number;
  recommendedDaily: number;
};

function getBudgetState(usagePercent: number) {
  if (usagePercent >= 100) {
    return {
      progressClass: "from-red-500 to-rose-500",
      badgeClass: "bg-red-100 text-red-700 border border-red-200",
      boxClass: "border border-red-200 bg-red-50 text-red-700",
      icon: Flame,
      label: "חריגה",
    };
  }

  if (usagePercent >= 80) {
    return {
      progressClass: "from-amber-400 to-orange-500",
      badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
      boxClass: "border border-amber-200 bg-amber-50 text-amber-700",
      icon: AlertTriangle,
      label: "מתקרב למגבלה",
    };
  }

  return {
    progressClass: "from-emerald-500 to-cyan-500",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    boxClass: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    label: "בשליטה",
  };
}

export default function BudgetOverviewCard({
  currencySymbol,
  budgetAmount,
  currentMonthTotal,
  remaining,
  overBudget,
  usagePercent,
  daysLeft,
  recommendedDaily,
}: BudgetOverviewCardProps) {
  const safeUsagePercent = Math.min(Math.max(usagePercent, 0), 100);
  const remainingPercent =
    budgetAmount > 0
      ? Math.max(0, 100 - (currentMonthTotal / budgetAmount) * 100)
      : 0;

  const state = getBudgetState(usagePercent);
  const StateIcon = state.icon;

  return (
    <div className="rounded-[1.75rem] border border-white/35 bg-white/95 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">תקציב חודשי</h2>
          <p className="mt-1 text-xs text-slate-500">
            {budgetAmount > 0
              ? `נותר ${currencySymbol}${remaining.toFixed(0)}`
              : "לא הוגדר תקציב"}
          </p>
        </div>

        {budgetAmount > 0 ? (
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${state.badgeClass}`}
          >
            <StateIcon size={13} />
            <span>{state.label}</span>
          </div>
        ) : null}
      </div>

      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {currencySymbol}
            {currentMonthTotal.toFixed(0)} הוצאות
          </span>
          <span>
            {budgetAmount > 0
              ? `${currencySymbol}${budgetAmount.toFixed(0)} תקציב`
              : "—"}
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${safeUsagePercent}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${state.progressClass}`}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium text-slate-500">
            {budgetAmount > 0 ? `${usagePercent.toFixed(0)}% נוצל` : "ללא תקציב"}
          </span>

          {budgetAmount > 0 ? (
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                usagePercent >= 100
                  ? "bg-red-100 text-red-700"
                  : usagePercent >= 80
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              נשאר {remainingPercent.toFixed(0)}%
            </span>
          ) : null}
        </div>
      </div>

      <div className={`rounded-[1rem] px-3 py-2.5 text-sm ${state.boxClass}`}>
        {budgetAmount <= 0
          ? "עדיין לא הוגדר תקציב חודשי במערכת"
          : overBudget > 0
          ? `חריגה של ${currencySymbol}${overBudget.toFixed(0)} מהתקציב`
          : usagePercent >= 80
          ? `שים לב, ניצלת כבר ${usagePercent.toFixed(
              0
            )}% מהתקציב החודשי`
          : `נותרו ${daysLeft} ימים - מומלץ להוציא עד ${currencySymbol}${recommendedDaily.toFixed(
              0
            )} / יום`}
      </div>
    </div>
  );
}