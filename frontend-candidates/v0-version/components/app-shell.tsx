"use client"

import { AppHeader } from './app-header'
import { BottomNavigation } from './bottom-navigation'

interface AppShellProps {
  children: React.ReactNode
  showHeader?: boolean
  showNav?: boolean
  headerActions?: boolean
}

export function AppShell({ 
  children, 
  showHeader = true, 
  showNav = true,
  headerActions = true 
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <AppHeader showActions={headerActions} />}
      <main className={showNav ? "pb-20 md:pb-0" : ""}>
        {children}
      </main>
      {showNav && <BottomNavigation />}
    </div>
  )
}
