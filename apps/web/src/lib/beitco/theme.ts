// Theme management for Beitco. Supports light / dark / system, persisted to
// localStorage and applied via the `.dark` class on <html> (Tailwind v4 strategy).

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "beitco:theme";

const isBrowser = typeof window !== "undefined";

export function getStoredTheme(): Theme {
  if (!isBrowser) return "system";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function systemPrefersDark(): boolean {
  if (!isBrowser) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolve a theme preference to the actual mode that should render. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

/** Apply the resolved theme to <html> by toggling the `.dark` class. */
export function applyTheme(theme: Theme): void {
  if (!isBrowser) return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

/** Persist a preference and apply it immediately. */
export function setTheme(theme: Theme): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Initialise theme on the client and keep it in sync with the OS when the
 * preference is "system". Returns an unsubscribe function.
 */
export function initTheme(): () => void {
  if (!isBrowser) return () => {};
  applyTheme(getStoredTheme());
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getStoredTheme() === "system") applyTheme("system");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * A tiny blocking script string injected into <head> so the correct theme is
 * applied before first paint (prevents a flash of the wrong theme).
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;
