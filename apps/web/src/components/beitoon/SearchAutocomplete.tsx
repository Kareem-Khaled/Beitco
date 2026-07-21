import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, MapPin, Clock } from "lucide-react";
import { arabicIncludes, AREA_OPTIONS } from "@beitoon/shared";

// Recent search terms (localStorage) — shown as suggestions when the box is empty.
const RECENT_KEY = "beitoon:recentSearches";
const RECENT_MAX = 6;

export function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string): string[] {
  const t = term.trim();
  if (!t || typeof window === "undefined") return loadRecentSearches();
  const next = [t, ...loadRecentSearches().filter((r) => r !== t)].slice(0, RECENT_MAX);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

// A smart search input: live Arabic-normalized area suggestions while typing,
// recent searches when empty, full keyboard nav (↑/↓/Enter/Esc), click-outside
// to close. Controlled value; `onSearch(term)` fires when a term is chosen or
// submitted (it also persists the term to recent searches).
export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "دوّر بالمنطقة، الكومباوند، أو اسم المكان…",
  className = "",
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: (term: string) => void;
  // Called when the ✕ clears the box. Defaults to onSearch("") — useful on the
  // results page (drops the q filter). On the homepage, pass a no-op so clearing
  // the box doesn't navigate anywhere.
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setRecent(loadRecentSearches()), []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const areaMatches = useMemo(() => {
    const term = value.trim();
    if (!term) return [];
    return AREA_OPTIONS.filter((a) => arabicIncludes(a, term)).slice(0, 8);
  }, [value]);

  const showRecent = value.trim() === "" && recent.length > 0;
  const suggestions = showRecent ? recent : areaMatches;

  const run = (term: string) => {
    const t = term.trim();
    onChange(t);
    setRecent(pushRecentSearch(t));
    setOpen(false);
    setIndex(-1);
    onSearch(t);
  };

  return (
    <div ref={ref} className={`relative flex flex-1 items-center gap-2 ${className}`}>
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) {
            if (e.key === "Enter") run(value);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => (i + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            run(index >= 0 ? suggestions[index]! : value);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
            setIndex(-1);
            // Clear + apply: default drops the q filter; homepage overrides with a no-op.
            if (onClear) onClear();
            else onSearch("");
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="مسح"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl border border-border bg-popover p-1 text-start shadow-lg">
          {showRecent ? (
            <li className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                عمليات بحث سابقة
              </span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  window.localStorage.removeItem(RECENT_KEY);
                  setRecent([]);
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                امسح
              </button>
            </li>
          ) : null}
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  run(s);
                }}
                onMouseEnter={() => setIndex(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition-colors ${
                  i === index ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                {showRecent ? (
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-trust" />
                )}
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
