"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'الرئيسية' },
  { href: '/explore', icon: Search, label: 'استكشاف' },
  { href: '/create', icon: Plus, label: 'إضافة', isCreate: true },
  { href: '/listings', icon: Building2, label: 'العقارات' },
  { href: '/profile', icon: User, label: 'حسابي' },
]

export function BottomNavigation() {
  const pathname = usePathname()

  // Hide on onboarding pages
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/splash')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
