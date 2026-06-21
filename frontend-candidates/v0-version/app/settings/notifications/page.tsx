"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  Bell,
  MessageSquare,
  Heart,
  UserPlus,
  Home,
  Tag,
  Megaphone,
  Mail
} from "lucide-react"

interface NotificationSetting {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  enabled: boolean
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "messages",
      label: "الرسائل",
      description: "إشعارات الرسائل الجديدة",
      icon: MessageSquare,
      enabled: true
    },
    {
      id: "likes",
      label: "الإعجابات",
      description: "عندما يعجب أحد بمنشوراتك",
      icon: Heart,
      enabled: true
    },
    {
      id: "comments",
      label: "التعليقات",
      description: "التعليقات على منشوراتك",
      icon: MessageSquare,
      enabled: true
    },
    {
      id: "follows",
      label: "المتابعون الجدد",
      description: "عندما يتابعك شخص جديد",
      icon: UserPlus,
      enabled: true
    },
    {
      id: "listings",
      label: "العقارات المهتم بها",
      description: "تحديثات على العقارات المحفوظة",
      icon: Home,
      enabled: true
    },
    {
      id: "price_drops",
      label: "تخفيضات الأسعار",
      description: "عندما ينخفض سعر عقار محفوظ",
      icon: Tag,
      enabled: true
    },
    {
      id: "promotions",
      label: "العروض الترويجية",
      description: "عروض وخصومات خاصة",
      icon: Megaphone,
      enabled: false
    },
    {
      id: "email",
      label: "إشعارات البريد",
      description: "تلقي الإشعارات عبر البريد",
      icon: Mail,
      enabled: false
    }
  ])

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  return (
    <AppShell showBackButton title="الإشعارات" showBottomNav={false}>
      <div className="p-4 pb-8">
        {/* Master Toggle */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">جميع الإشعارات</p>
                  <p className="text-xs text-muted-foreground">تفعيل/تعطيل كل الإشعارات</p>
                </div>
              </div>
              <Switch 
                checked={settings.some(s => s.enabled)}
                onCheckedChange={(checked) => {
                  setSettings(settings.map(s => ({ ...s, enabled: checked })))
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Individual Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">تفضيلات الإشعارات</CardTitle>
            <CardDescription>اختر نوع الإشعارات التي تريد تلقيها</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <setting.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
                <Switch 
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
