'use client'

import { ArrowRight, Check, Globe } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const languages = [
  { code: 'ar', name: 'العربية', nativeName: 'العربية', region: 'مصر' },
  { code: 'en', name: 'English', nativeName: 'English', region: 'Egypt' },
]

export default function LanguageSettingsPage() {
  const [selected, setSelected] = useState('ar')

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
          <h1 className="text-lg font-bold">اللغة والمنطقة</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">لغة التطبيق</h2>
          <div className="rounded-lg border bg-card divide-y">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className="flex w-full items-center justify-between p-4 text-start"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lang.nativeName}</p>
                    <p className="text-sm text-muted-foreground">{lang.region}</p>
                  </div>
                </div>
                {selected === lang.code && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center">
          سيتم إعادة تحميل التطبيق عند تغيير اللغة
        </p>
      </div>
    </div>
  )
}
