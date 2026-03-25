"use client";

import { ReactNode } from "react";

type FinanceItemRowProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  amount?: string;
  meta?: string;
  badges?: ReactNode;
  onClick?: () => void;
  iconWrapperClassName?: string;
  amountClassName?: string;
};

export default function FinanceItemRow({
  icon,
  title,
  subtitle,
  amount,
  meta,
  badges,
  onClick,
  iconWrapperClassName,
  amountClassName,
}: FinanceItemRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-white px-4 py-3 text-right shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ${
              iconWrapperClassName || ""
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {title}
            </div>

            {subtitle && (
              <div className="mt-0.5 truncate text-xs text-slate-500">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 text-left">
          {amount && (
            <div
              className={`text-sm font-semibold text-slate-900 ${
                amountClassName || ""
              }`}
            >
              {amount}
            </div>
          )}

          {meta && <div className="mt-0.5 text-xs text-slate-500">{meta}</div>}
        </div>
      </div>

      {badges && (
        <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>
      )}
    </button>
  );
}