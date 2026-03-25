type AppCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}