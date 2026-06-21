import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  step,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  step?: { current: number; total: number };
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="font-display text-2xl font-bold text-trust">
            بيتكو
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ارجع للرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10">
        {step && (
          <div className="mb-6 flex items-center gap-1.5">
            {Array.from({ length: step.total }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step.current ? "bg-trust" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
        <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
