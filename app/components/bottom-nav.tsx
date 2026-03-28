"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  RefreshCcw,
  Ticket,
  Wallet,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "בית", icon: Home },
  { href: "/expenses", label: "הוצאות", icon: Receipt },
  { href: "/subscriptions", label: "מנויים", icon: RefreshCcw },
  { href: "/vouchers", label: "שוברים", icon: Ticket },
  { href: "/credits", label: "זיכויים", icon: Wallet },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center">
      <nav className="flex w-full max-w-[420px] items-center justify-between rounded-3xl border border-white/40 bg-white/70 px-2 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 justify-center"
            >
              <div
                className={`relative flex min-w-[52px] flex-col items-center justify-center px-2 py-2 transition-all duration-300`}
              >
                {/* Active background pill */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-b from-teal-500/20 to-teal-400/10"
                      : "bg-transparent"
                  }`}
                />

                {/* Icon */}
                <Icon
                  size={18}
                  className={`relative z-10 transition-all duration-300 ${
                    isActive
                      ? "text-teal-600 scale-110"
                      : "text-slate-400"
                  }`}
                />

                {/* Label */}
                <span
                  className={`relative z-10 mt-1 text-[10px] transition-all duration-300 ${
                    isActive
                      ? "text-teal-600 font-semibold"
                      : "text-slate-400 font-medium"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-teal-500" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}