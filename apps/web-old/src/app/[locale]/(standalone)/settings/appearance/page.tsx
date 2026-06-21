'use client'

import { ArrowRight, Sun, Moon, Monitor, Check } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

const themes = [
  { value: 'light', label: 'فاتح', icon: Sun },
  { value: 'dark', label: 'داكن', icon: Moon },
  { value: 'system', label: 'تلقائي (حسب النظام)', icon: Monitor },
]

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">المظهر</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Theme Selection */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">وضع العرض</h2>
          <div className="rounded-lg border bg-card divide-y">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className="flex w-full items-center justify-between p-4 text-start"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{label}</p>
                </div>
                {theme === value && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">معاينة</h2>
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20" />
              <div className="space-y-1">
                <div className="h-3 w-24 rounded bg-foreground/20" />
                <div className="h-2 w-16 rounded bg-muted-foreground/20" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-foreground/10" />
            <div className="h-3 w-3/4 rounded bg-foreground/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
