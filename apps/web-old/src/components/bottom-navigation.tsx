"use client"

import { Link } from '@/i18n/routing'
import { usePathname } from '@/i18n/routing'
import { Home, Search, PlusCircle, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'الرئيسية' },
  { href: '/browse', icon: Search, label: 'تصفح' },
  { href: '/post', icon: PlusCircle, label: 'أضف شقة' },
  { href: '/matches', icon: Sparkles, label: 'مقترحات' },
  { href: '/profile', icon: User, label: 'حسابي' },
]

export function BottomNavigation() {
  const pathname = usePathname()

  // Hide on onboarding pages
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/splash')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
