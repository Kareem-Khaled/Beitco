'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { currentUser } from '@/lib/mock-data';

export default function SettingsPage() {
  return (
    <MainLayout showHeader={false} showBottomNav={true}>
      <div className="max-w-2xl mx-auto pb-lg">
        <div className="sticky top-0 z-30 bg-background border-b border-border px-md py-md flex items-center gap-md">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="min-touch">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-h2 font-bold">الإعدادات</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border bg-transparent p-0 px-md">
            <TabsTrigger value="general" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption">
              عام
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption">
              الخصوصية
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption">
              إشعارات
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-none border-b-2 data-[state=active]:border-beitco-blue-DEFAULT text-caption">
              الحساب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="px-md py-lg space-y-md">
            <div>
              <h2 className="text-h3 font-bold mb-md">معلومات الملف الشخصي</h2>

              <Card className="rounded-card p-lg border-border space-y-md">
                <div>
                  <Label className="text-caption font-medium">الاسم</Label>
                  <Input defaultValue={currentUser.name} className="mt-2 rounded-input" />
                </div>

                <div>
                  <Label className="text-caption font-medium">البيو</Label>
                  <Input
                    defaultValue={currentUser.bio}
                    maxLength={150}
                    className="mt-2 rounded-input"
                  />
                </div>

                <div>
                  <Label className="text-caption font-medium">المدينة</Label>
                  <select className="w-full mt-2 p-3 rounded-input border border-input bg-background">
                    <option value="cairo">القاهرة</option>
                    <option value="giza">الجيزة</option>
                    <option value="alexandria">الإسكندرية</option>
                  </select>
                </div>

                <Button className="w-full rounded-button bg-beitco-blue-DEFAULT text-body font-medium">
                  حفظ التغييرات
                </Button>
              </Card>
            </div>

            <div>
              <h2 className="text-h3 font-bold mb-md">اللغة والمظهر</h2>

              <Card className="rounded-card p-lg border-border space-y-md">
                <div className="flex items-center justify-between">
                  <Label className="text-body">اللغة</Label>
                  <select className="w-32 p-2 rounded-input border border-input bg-background text-caption">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-body">الوضع الليلي</Label>
                  <Switch />
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="px-md py-lg space-y-md">
            <Card className="rounded-card p-lg border-border space-y-md">
              <div className="flex items-center justify-between">
                <Label className="text-body">الملف الشخصي عام</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-body">السماح برسائل من أي شخص</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-body">عرض أنشطتي</Label>
                <Switch defaultChecked />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="px-md py-lg space-y-md">
            <Card className="rounded-card p-lg border-border space-y-md">
              <div className="flex items-center justify-between">
                <Label className="text-body">الإشعارات العامة</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-body">إشعارات الإعجابات</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-body">إشعارات التعليقات</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-body">إشعارات المتابعين الجدد</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-body">إشعارات الرسائل</Label>
                <Switch defaultChecked />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="px-md py-lg space-y-md">
            <Card className="rounded-card p-lg border-border space-y-md">
              <div>
                <Label className="text-caption font-medium">رقم الهاتف</Label>
                <Input disabled defaultValue="+20 1234567890" className="mt-2 rounded-input" />
              </div>

              <Button variant="outline" className="w-full rounded-button text-body font-medium">
                تغيير كلمة السر
              </Button>

              <Button variant="outline" className="w-full rounded-button text-body font-medium">
                تحميل بيانات حسابي
              </Button>

              <Button
                variant="destructive"
                className="w-full rounded-button text-body font-medium"
              >
                حذف الحساب
              </Button>
            </Card>

            <Button
              variant="outline"
              className="w-full rounded-button text-body font-medium"
            >
              <LogOut className="w-5 h-5 me-2" />
              تسجيل الخروج
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
