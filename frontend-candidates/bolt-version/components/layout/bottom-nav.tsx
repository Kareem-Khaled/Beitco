'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Chrome as Home, Compass, Plus, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'الرئيسية', id: 'home' },
  { href: '/explore', icon: Compass, label: 'استكشاف', id: 'explore' },
  { href: '/create', icon: Plus, label: '', id: 'create', isCreate: true },
  { href: '/listings', icon: Building2, label: 'العقارات', id: 'listings' },
  { href: '/profile', icon: User, label: 'حسابي', id: 'profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/onboarding')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-inline-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-end justify-around px-md py-xs">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center justify-center -translate-y-3 min-touch"
              >
                <div className="w-12 h-12 rounded-full bg-beitco-blue hover:bg-beitco-blue-hover flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 min-touch justify-center',
                'transition-colors',
                isActive ? 'text-beitco-blue' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-6 h-6" />
              {item.label && (
                <span className="text-micro font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
