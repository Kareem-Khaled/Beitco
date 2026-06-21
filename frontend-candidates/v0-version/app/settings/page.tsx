"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Palette,
  HelpCircle,
  FileText,
  LogOut,
  ChevronLeft,
  Moon,
  Sun,
  Shield,
  Smartphone,
  CreditCard,
  Eye
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { mockCurrentUser } from "@/lib/mock-data"

const settingsSections = [
  {
    title: "الحساب",
    items: [
      { icon: User, label: "معلومات الحساب", href: "/settings/account", description: "تعديل البيانات الشخصية" },
      { icon: Lock, label: "الأمان", href: "/settings/security", description: "كلمة المرور والتحقق" },
      { icon: Shield, label: "الخصوصية", href: "/settings/privacy", description: "التحكم في من يرى معلوماتك" },
    ]
  },
  {
    title: "التفضيلات",
    items: [
      { icon: Bell, label: "الإشعارات", href: "/settings/notifications", description: "إدارة تنبيهات التطبيق" },
      { icon: Globe, label: "اللغة والمنطقة", href: "/settings/language", description: "العربية - مصر" },
      { icon: Palette, label: "المظهر", href: "/settings/appearance", description: "الوضع الداكن والألوان" },
    ]
  },
  {
    title: "الدفع",
    items: [
      { icon: CreditCard, label: "وسائل الدفع", href: "/settings/payment", description: "إدارة البطاقات" },
      { icon: FileText, label: "الاشتراكات", href: "/settings/subscriptions", description: "خطتك الحالية" },
    ]
  },
  {
    title: "الدعم",
    items: [
      { icon: HelpCircle, label: "مركز المساعدة", href: "/help", description: "الأسئلة الشائعة" },
      { icon: FileText, label: "الشروط والأحكام", href: "/terms", description: "سياسة الاستخدام" },
      { icon: Eye, label: "سياسة الخصوصية", href: "/privacy", description: "كيف نستخدم بياناتك" },
    ]
  }
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)

  return (
    <AppShell showBackButton title="الإعدادات" showBottomNav={false}>
      <div className="p-4 pb-8">
        {/* Profile Card */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <Link href="/settings/account" className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={mockCurrentUser.avatar} alt={mockCurrentUser.name} />
                <AvatarFallback>{mockCurrentUser.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{mockCurrentUser.name}</h3>
                <p className="text-sm text-muted-foreground">{mockCurrentUser.phone}</p>
                <p className="text-xs text-primary mt-1">تعديل الملف الشخصي</p>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">الوضع الداكن</span>
              </div>
              <Switch 
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-medium">الإشعارات</span>
              </div>
              <Switch 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
              {section.title}
            </h3>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0 divide-y divide-border">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    href={item.href}
                    className="flex items-center gap-4 p-4 hover:bg-accent transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-5 w-5 ml-2" />
          تسجيل الخروج
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          بيتكو الإصدار 1.0.0
        </p>
      </div>
    </AppShell>
  )
}
