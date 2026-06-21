"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { 
  Camera, 
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Save
} from "lucide-react"
import { mockCurrentUser } from "@/lib/mock-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const egyptianCities = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الشرقية",
  "المنوفية",
  "القليوبية",
  "البحيرة",
  "الغربية",
  "كفر الشيخ",
  "الدقهلية",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "شمال سيناء",
  "جنوب سيناء",
  "البحر الأحمر",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "الوادي الجديد",
  "مطروح"
]

export default function AccountSettingsPage() {
  const [formData, setFormData] = useState({
    name: mockCurrentUser.name,
    phone: mockCurrentUser.phone,
    email: "ahmed.hassan@email.com",
    city: "القاهرة",
    area: "التجمع الخامس",
    bio: mockCurrentUser.bio,
    company: "شركة الحسن العقارية"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

  return (
    <AppShell showBackButton title="معلومات الحساب" showBottomNav={false}>
      <form onSubmit={handleSubmit} className="p-4 pb-8">
        {/* Profile Photo */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={mockCurrentUser.avatar} alt={formData.name} />
                <AvatarFallback className="text-2xl">{formData.name[0]}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute bottom-0 left-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">اضغط لتغيير الصورة</p>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">الاسم الكامل</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-right"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">نبذة عنك</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="text-right resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              معلومات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">رقم الهاتف</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-right"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              الموقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">المحافظة</label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  {egyptianCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">المنطقة</label>
              <Input
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              معلومات العمل (اختياري)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium mb-1.5 block">اسم الشركة</label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="text-right"
                placeholder="إذا كنت وسيط عقاري أو شركة"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button type="submit" className="w-full" size="lg">
          <Save className="h-5 w-5 ml-2" />
          حفظ التغييرات
        </Button>
      </form>
    </AppShell>
  )
}
