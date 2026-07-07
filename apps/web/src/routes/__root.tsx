import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError, initSentry } from "@/lib/sentry";
import { AuthProvider } from "@/lib/beitco/auth";
import { useChatSocket } from "@/lib/beitco/useChatSocket";
import { initTheme, themeInitScript } from "@/lib/beitco/theme";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/beitco/BottomNav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة دي مش موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة اللي بتدوّر عليها مش موجودة أو اتنقلت لمكان تاني.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ارجع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          الصفحة دي ما اتحمّلتش
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          فيه حاجة غلط حصلت. جرّب تعمل ريفرش أو ارجع للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            جرّب تاني
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            ارجع للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "بيتكو — أجّر سرير، أوضة، أو شقة في مصر" },
      {
        name: "description",
        content:
          "بيتكو أول منصة في مصر تأجّرك بالسرير — سرير، أوضة، أو شقة كاملة للإيجار أو للبيع. سكن متأكدين منه بأسعار واضحة وآراء حقيقية ودرجة ثقة لكل مكان.",
      },
      { name: "theme-color", content: "#14534c" },
      { property: "og:site_name", content: "بيتكو" },
      { property: "og:title", content: "بيتكو — أجّر سرير، أوضة، أو شقة في مصر" },
      { property: "og:description", content: "منصة السكن الموثوقة في مصر." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_EG" },
      { property: "og:image", content: "/og.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "بيتكو — أجّر سرير، أوضة، أو شقة في مصر" },
      { name: "twitter:description", content: "منصة السكن الموثوقة في مصر." },
      { name: "twitter:image", content: "/og.svg" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      // Leaflet map styles (keyless OpenStreetMap) for the listing location picker.
      { rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Lives inside AuthProvider + QueryClientProvider: opens the chat socket while
// authenticated (API mode) and invalidates chat queries on live messages.
function ChatSocketBridge() {
  useChatSocket();
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => initTheme(), []);
  // OBS-2: init client error tracking once (no-op without VITE_SENTRY_DSN).
  useEffect(() => initSentry(), []);

  // Accessibility: make the active route's <main> the skip-link target and a
  // programmatic focus stop. Runs after each navigation since each route owns
  // its own <main> (there's no shared layout element).
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (!main.id) main.id = "main-content";
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatSocketBridge />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          تخطّى للمحتوى
        </a>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <BottomNav />
        <Toaster
          dir="rtl"
          position="top-center"
          richColors
          style={{ fontFamily: "var(--font-sans)" }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
