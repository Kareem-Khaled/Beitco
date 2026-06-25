import { type ReactElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";

// TEST-3: a light render helper for component tests. Components that use
// TanStack Query get a real (retry-disabled) client; components that use the
// router's <Link>/useNavigate should mock "@tanstack/react-router" at the top
// of their spec (see BeitcoListingCard.test.tsx) — that's lighter than spinning
// up a full memory router for a unit test.
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

export function renderWithQuery(ui: ReactElement): RenderResult {
  const client = makeTestQueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

export function QueryWrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={makeTestQueryClient()}>{children}</QueryClientProvider>;
}
