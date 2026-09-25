export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-[var(--bg-page)]">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
        </header>

        {children}

        <p className="text-center text-sm text-[var(--text-secondary)]">{footer}</p>
      </div>
    </main>
  );
}
