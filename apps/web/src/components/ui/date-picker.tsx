import * as React from "react";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Parse a "YYYY-MM-DD" string into a local Date (avoids UTC off-by-one).
function parseISODate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Format a Date back to "YYYY-MM-DD" in local time.
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Friendly Arabic label with Latin digits.
function formatLabel(date: Date): string {
  return date.toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type DatePickerProps = {
  value?: string; // ISO "YYYY-MM-DD"
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  /** Disable dates before today. */
  disablePast?: boolean;
  className?: string;
  id?: string;
};

/**
 * A polished date picker (Popover + Calendar) that replaces the native
 * `<input type="date">` so it matches the rest of the design system  -  same
 * look as the Select dropdowns, RTL-aware, Arabic month names + Latin digits.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "اختار التاريخ",
  disablePast,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseISODate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 bg-surface font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          {selected ? formatLabel(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir="rtl">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={disablePast ? { before: today } : undefined}
          onSelect={(date) => {
            onChange(date ? toISODate(date) : undefined);
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
