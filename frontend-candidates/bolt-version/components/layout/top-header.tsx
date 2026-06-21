'use client';

import Link from 'next/link';
import { Bell, MessageCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function TopHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-lg py-md flex items-center justify-between h-16">
        <Link href="/" className="text-h2 font-bold text-beitco-blue-DEFAULT">
          بيتكو
        </Link>

        <div className="flex items-center gap-md">
          <Button
            variant="ghost"
            size="icon"
            className="min-touch"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="min-touch relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </Link>

          <Link href="/chat">
            <Button variant="ghost" size="icon" className="min-touch">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
