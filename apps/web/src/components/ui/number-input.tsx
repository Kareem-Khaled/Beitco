import * as React from "react";

import { Input } from "./input";

// Maps Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin so they're accepted.
const DIGIT_MAP: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

export function toLatinDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d);
}

type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
};

/**
 * A numeric input that actually works for Arabic users.
 *
 * Native `type="number"` silently REJECTS Arabic-Indic digits (٠١٢٣…), so an
 * Egyptian typing on an Arabic keyboard "can't write" anything. This uses
 * `type="text"` + `inputMode="numeric"` (numeric keypad on mobile, no spinner
 * arrows) and normalizes Arabic/Persian digits → Latin while keeping digits only.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onValueChange, min, max, onBlur, ...props }, ref) => {
    const [text, setText] = React.useState(value != null ? String(value) : "");

    // Keep local text in sync when the external value changes from outside
    // (reset, edit hydration) without clobbering what the user is typing.
    React.useEffect(() => {
      const current = text === "" ? undefined : Number(text);
      if (value !== current) setText(value != null ? String(value) : "");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          const next = toLatinDigits(e.target.value).replace(/[^\d]/g, "");
          setText(next);
          onValueChange(next === "" ? undefined : Number(next));
        }}
        onBlur={(e) => {
          if (text !== "" && (min != null || max != null)) {
            let n = Number(text);
            if (min != null) n = Math.max(min, n);
            if (max != null) n = Math.min(max, n);
            if (n !== Number(text)) {
              setText(String(n));
              onValueChange(n);
            }
          }
          onBlur?.(e);
        }}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";
