type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

export default function AppShell({ children, className = "" }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <div
        className={`mx-auto min-h-screen w-full max-w-[440px] bg-[#f5f7f8] px-4 pb-24 pt-6 ${className}`}
      >
        {children}
      </div>
    </main>
  );
}