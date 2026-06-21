"use client"

import Link from 'next/link'
import { Bell, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppHeaderProps {
  showActions?: boolean
}

export function AppHeader({ showActions = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <span className="text-primary-foreground font-bold text-lg">ب</span>
          </div>
          <span className="font-bold text-xl text-foreground">بيتكو</span>
        </Link>

        {showActions && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 end-2 w-2 h-2 bg-destructive rounded-full" />
                <span className="sr-only">الإشعارات</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/messages">
                <MessageCircle className="w-5 h-5" />
                <span className="absolute top-2 end-2 w-2 h-2 bg-primary rounded-full" />
                <span className="sr-only">الرسائل</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
