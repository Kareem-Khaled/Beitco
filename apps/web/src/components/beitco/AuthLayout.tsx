import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/beitco/Logo";

// Shared shell for the auth flow (login / verify / profile). Matches the app's
// header (logo + brand), then a clean centered form with the logo above it.
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
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header  -  matches SiteHeader */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="font-display text-xl font-semibold tracking-tight">بيتون</span>
          </Link>
          <Link
            to="/"
            className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ارجع للرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
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

        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <Logo className="h-14 w-14 shrink-0 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
