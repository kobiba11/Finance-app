import { ReactNode } from "react";

type AppCardProps = {
  children: ReactNode;
  className?: string;
};

export default function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/35 bg-white/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}