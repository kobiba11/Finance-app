import Link from "next/link";

type AttentionItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "subscription" | "voucher" | "credit";
  dateLabel: string;
};

type Props = {
  items: AttentionItem[];
};

export default function AttentionSection({ items }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">דורש תשומת לב</h2>
        </div>

        <p className="text-sm text-slate-500">אין כרגע פריטים דחופים 🎉</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">דורש תשומת לב</h2>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
          {items.length} פריטים
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const href =
            item.type === "subscription"
              ? "/subscriptions"
              : item.type === "voucher"
              ? "/vouchers"
              : "/credits";

          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={href}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                </div>

                <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 whitespace-nowrap">
                  {item.dateLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}