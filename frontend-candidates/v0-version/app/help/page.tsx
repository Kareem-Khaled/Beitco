"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Search,
  MessageCircle,
  Phone,
  Mail,
  Home,
  CreditCard,
  Shield,
  User,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"

const categories = [
  { icon: Home, label: "العقارات والإعلانات", count: 12 },
  { icon: User, label: "الحساب والملف الشخصي", count: 8 },
  { icon: CreditCard, label: "الدفع والاشتراكات", count: 6 },
  { icon: Shield, label: "الأمان والخصوصية", count: 5 },
]

const faqs = [
  {
    question: "كيف أنشر إعلان عقار جديد؟",
    answer: "اضغط على زر '+' في الشريط السفلي، ثم اختر 'إعلان عقار'، واملأ بيانات العقار مع إضافة الصور، ثم اضغط 'نشر'."
  },
  {
    question: "كيف أوثق حسابي؟",
    answer: "اذهب إلى الإعدادات > الأمان > توثيق الحساب، وارفع صورة من بطاقة الهوية، سيتم مراجعة طلبك خلال 24-48 ساعة."
  },
  {
    question: "هل يمكنني تعديل إعلاني بعد النشر؟",
    answer: "نعم، يمكنك تعديل إعلانك في أي وقت من صفحة 'إعلاناتي' بالضغط على الإعلان ثم اختيار 'تعديل'."
  },
  {
    question: "كيف أتواصل مع صاحب العقار؟",
    answer: "يمكنك إرسال رسالة مباشرة من صفحة العقار، أو الاتصال إذا كان رقم الهاتف متاحاً."
  },
  {
    question: "ما هي باقات الاشتراك المتاحة؟",
    answer: "نقدم باقة مجانية بإعلانات محدودة، وباقات مدفوعة تتضمن مميزات إضافية مثل الإعلانات المميزة والظهور الأول في البحث."
  },
  {
    question: "كيف أحذف حسابي؟",
    answer: "اذهب إلى الإعدادات > الأمان > حذف الحساب. سيتم حذف جميع بياناتك نهائياً ولا يمكن استرجاعها."
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaqs = faqs.filter(faq => 
    faq.question.includes(searchQuery) || faq.answer.includes(searchQuery)
  )

  return (
    <AppShell showBackButton title="مركز المساعدة" showBottomNav={false}>
      <div className="p-4 pb-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن سؤالك..."
            className="pr-10 h-12"
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">تصفح حسب الموضوع</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, index) => (
              <Card key={index} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{category.label}</p>
                  <p className="text-xs text-muted-foreground">{category.count} مقالة</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">الأسئلة الشائعة</h3>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0">
                    <AccordionTrigger className="px-4 text-right hover:no-underline">
                      <span className="text-sm font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div>
          <h3 className="font-semibold mb-3">تواصل معنا</h3>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 divide-y divide-border">
              <Link href="#" className="flex items-center gap-4 p-4 hover:bg-accent transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">المحادثة المباشرة</p>
                  <p className="text-xs text-muted-foreground">متاح 24/7</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="tel:+201234567890" className="flex items-center gap-4 p-4 hover:bg-accent transition-colors">
                <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">اتصل بنا</p>
                  <p className="text-xs text-muted-foreground">+20 123 456 7890</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
              <Link href="mailto:support@beitco.com" className="flex items-center gap-4 p-4 hover:bg-accent transition-colors">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">البريد الإلكتروني</p>
                  <p className="text-xs text-muted-foreground">support@beitco.com</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
