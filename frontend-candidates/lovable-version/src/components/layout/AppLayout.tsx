import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, Building2, User, Bell, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/search", label: "استكشاف", icon: Search },
  { path: "/create", label: "إضافة", icon: Plus, isCreate: true },
  { path: "/listings", label: "العقارات", icon: Building2 },
  { path: "/profile", label: "حسابي", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[680px] mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-h2 text-primary font-bold font-arabic">بيتكو</h1>
          <div className="flex items-center gap-1">
            <Link
              to="/notifications"
              className="touch-target flex items-center justify-center rounded-full hover:bg-accent transition-colors relative"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -start-0.5 w-2 h-2 bg-destructive rounded-full" />
            </Link>
            <Link
              to="/chat"
              className="touch-target flex items-center justify-center rounded-full hover:bg-accent transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
        <div className="max-w-[680px] mx-auto flex items-center justify-around px-2 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            if (item.isCreate) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center -mt-3"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-elevated">
                    <Plus className="w-6 h-6 text-primary-foreground" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 touch-target transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-micro">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
