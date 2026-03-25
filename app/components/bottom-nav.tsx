"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  List,
  RefreshCcw,
  Ticket,
  Wallet,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "בית", icon: Home },
  { href: "/expenses", label: "הוצאות", icon: List },
  { href: "/subscriptions", label: "מנויים", icon: RefreshCcw },
  { href: "/vouchers", label: "שוברים", icon: Ticket },
  { href: "/credits", label: "זיכויים", icon: Wallet },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[440px] grid-cols-6 px-2 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}