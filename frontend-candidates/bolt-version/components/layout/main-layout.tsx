'use client';

import { TopHeader } from './top-header';
import { BottomNav } from './bottom-nav';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function MainLayout({
  children,
  showHeader = true,
  showBottomNav = true
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <TopHeader />}
      <main className={showBottomNav ? 'pb-20 md:pb-0' : ''}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
