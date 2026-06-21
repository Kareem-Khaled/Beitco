"use client"

import { use } from 'react'
import Image from 'next/image'
import {
  BedDouble, ShieldCheck, Star, Users, Wifi, Snowflake, WashingMachine,
  MapPin, MessageCircle, Heart, Share2, ChevronRight, Phone, CheckCircle2, HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrustBadge } from '@/components/trust-badge'
import { ScoreBar } from '@/components/score-bar'
import { cn } from '@/lib/utils'

const apartment = {
  id: '1',
  title: 'شقة 3 غرف مفروشة بالكامل',
  area: 'التجمع الخامس · القاهرة الجديدة',
  address: 'شارع التسعين الجنوبي، التجمع الخامس',
  type: 'شقة',
  price: 2500,
  trust: 9.2,
  verified: true,
  reviewsCount: 24,
  residents: 6,
  images: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop',
  ],
  description: 'شقة مفروشة بالكامل، 3 غرف كل غرفة فيها سريرين. المكان نضيف وهادي ومجهز بكل حاجة. قريبة من الجامعة الأمريكية والمواصلات. فيها نت سريع وتكييف في كل غرفة. السكان الحاليين طلاب ومحترمين. مناسبة جداً للطلاب والموظفين.',
  nearbyLandmark: '8 دقائق من الجامعة الأمريكية',
  gender: 'male' as const,
  quality: { internet: 9.4, safety: 9.1, noise: 8.7, maintenance: 9.0, cleanliness: 9.3 },
  amenities: ['واي فاي 200 ميجا', 'تكييف', 'غسالة', 'مايكروويف', 'ثلاجة', 'أسانسير', 'موقف سيارات', 'حارس 24/7', 'مفروشة'],
  beds: { total: 6, occupied: 4 },
  costs: [
    { label: 'إيجار السرير', amount: 2500 },
    { label: 'إنترنت', amount: 0 },
    { label: 'كهرباء (متوسط)', amount: 150 },
    { label: 'مياه', amount: 20 },
    { label: 'نظافة', amount: 50 },
  ],
  landlord: {
    name: 'مصطفى ح.',
    initials: 'مح',
    trust: 9.4,
    responseRate: 97,
    verified: true,
  },
  reviews: [
    { id: 'r1', author: 'نور أ.', initials: 'نأ', monthsLived: 8, rating: 9.5, date: 'منذ أسبوع', body: 'أفضل شقة سكنت فيها. المالك محترم جداً والمكان نضيف ومرتب. النت سريع وما فيش مشاكل.' },
    { id: 'r2', author: 'أحمد م.', initials: 'أم', monthsLived: 12, rating: 8.8, date: 'منذ شهر', body: 'مكان ممتاز وقريب من كل حاجة. الجيران محترمين والجو هادي. أنصح بيه.' },
  ],
  qa: [
    { id: 'q1', q: 'هل فيه حد أدنى لمدة الإقامة؟', asker: 'محمد', date: 'منذ 3 أيام', a: 'أيوه، 3 شهور حد أدنى.', answerer: 'المالك' },
    { id: 'q2', q: 'المكان قريب من مواصلات؟', asker: 'سارة', date: 'منذ أسبوع', a: undefined, answerer: undefined },
  ],
}

export default function ApartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const p = apartment
  const totalCost = p.costs.reduce((s, c) => s + c.amount, 0)
  const avgQuality = Object.values(p.quality).reduce((s, v) => s + v, 0) / Object.values(p.quality).length

  return (
    <div className="min-h-screen pb-28">
      {/* Gallery */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-b-3xl bg-muted">
        <Image src={p.images[0]} alt={p.title} fill className="object-cover" unoptimized />
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Heart className="h-4 w-4 text-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Share2 className="h-4 w-4 text-foreground" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium shadow-sm">{p.type}</span>
          {p.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2.5 py-1 text-[11px] font-medium text-trust-foreground shadow-sm">
              <ShieldCheck className="h-3 w-3" /> موثّق
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <TrustBadge score={p.trust} className="shadow-sm" />
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Title & Price */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{p.title}</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5" /> {p.area}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">📍 {p.nearbyLandmark}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-semibold tabular-nums">{p.price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">جنيه / سرير / شهر</span>
          </div>
        </div>

        {/* Trust & Verification */}
        <section className="rounded-2xl border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">الثقة والتحقق</h2>
            <TrustBadge score={p.trust} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox icon={ShieldCheck} label="التحقق" value={p.verified ? 'موثّق' : 'قيد المراجعة'} tone={p.verified ? 'trust' : 'muted'} />
            <StatBox icon={Star} label="التقييمات" value={String(p.reviewsCount)} tone="muted" />
            <StatBox icon={Users} label="سكنوا قبل كده" value={String(p.residents)} tone="muted" />
            <StatBox icon={MessageCircle} label="نسبة الرد" value={`${p.landlord.responseRate}%`} tone="muted" />
          </div>
        </section>

        {/* Housing Quality Scores */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">جودة السكن</h2>
            <span className="text-xs text-muted-foreground">
              متوسط <span className="font-semibold text-foreground">{avgQuality.toFixed(1)}</span> · تقييم السكان
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border bg-surface p-5 sm:grid-cols-2">
            <ScoreBar label="الإنترنت" value={p.quality.internet} />
            <ScoreBar label="الأمان" value={p.quality.safety} />
            <ScoreBar label="الهدوء" value={p.quality.noise} />
            <ScoreBar label="الصيانة" value={p.quality.maintenance} />
            <ScoreBar label="النظافة" value={p.quality.cleanliness} />
          </div>
        </section>

        {/* Beds Occupancy Visual */}
        <section className="rounded-2xl border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">الأسرّة</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {p.beds.total - p.beds.occupied}/{p.beds.total} متاح
            </span>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {Array.from({ length: p.beds.total }).map((_, i) => {
              const occupied = i < p.beds.occupied
              return (
                <div
                  key={i}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-xl border-2",
                    occupied
                      ? "border-border bg-muted text-muted-foreground"
                      : "border-trust/40 bg-trust-soft text-primary"
                  )}
                >
                  <BedDouble className="h-5 w-5" />
                  <span className="mt-1 text-[9px] font-medium">
                    {occupied ? 'مشغول' : 'فاضي'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-trust" />متاح</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-border" />مشغول</span>
          </div>
        </section>

        {/* Description */}
        <section>
          <h2 className="text-base font-semibold">عن المكان</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
        </section>

        {/* Amenities */}
        <section>
          <h2 className="text-base font-semibold">المميزات</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {p.amenities.map(a => (
              <div key={a} className="flex items-center gap-3 rounded-xl border bg-surface p-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trust-soft text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-xs">{a}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="rounded-2xl border bg-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">التكلفة الشهرية</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {p.costs.map(c => (
              <li key={c.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="tabular-nums font-medium">
                  {c.amount === 0 ? 'مشمول' : `${c.amount.toLocaleString()} جنيه`}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-sm font-semibold">الإجمالي المتوقع</span>
            <span className="text-lg font-semibold tabular-nums">{totalCost.toLocaleString()} جنيه</span>
          </div>
        </section>

        {/* Reviews */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">تقييمات السكان</h2>
            <span className="text-xs text-muted-foreground">{p.reviewsCount} تقييم</span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {p.reviews.map(r => (
              <article key={r.id} className="rounded-2xl border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {r.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{r.author}</div>
                      <div className="text-[10px] text-muted-foreground">
                        سكن {r.monthsLived} شهور · {r.date}
                      </div>
                    </div>
                  </div>
                  <TrustBadge score={r.rating} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{r.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Q&A */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">أسئلة وأجوبة</h2>
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
              <HelpCircle className="h-3.5 w-3.5" /> اسأل سؤال
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {p.qa.map(q => (
              <article key={q.id} className="rounded-2xl border bg-surface p-4">
                <div className="text-sm font-medium">{q.q}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{q.asker} · {q.date}</div>
                {q.a ? (
                  <div className="mt-3 rounded-xl bg-trust-soft p-3">
                    <div className="text-[10px] font-semibold text-primary">{q.answerer}</div>
                    <p className="mt-1 text-xs">{q.a}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] italic text-muted-foreground">لسه مفيش إجابة</p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Landlord */}
        <section className="rounded-2xl border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {p.landlord.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {p.landlord.name}
                {p.landlord.verified && <ShieldCheck className="h-3.5 w-3.5 text-trust" />}
              </div>
              <div className="text-[10px] text-muted-foreground">
                ثقة {p.landlord.trust.toFixed(1)} · يرد {p.landlord.responseRate}%
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 inset-x-0 p-4 bg-background/95 backdrop-blur-md border-t shadow-[var(--shadow-soft)]">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
            <Phone className="h-4 w-4" />
          </Button>
          <Button className="flex-1 gap-2 rounded-xl" size="lg">
            <MessageCircle className="h-4 w-4" /> اطلب حجز سرير
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'trust' | 'muted' }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted/50 p-3">
      <span className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg",
        tone === 'trust' ? "bg-trust text-trust-foreground" : "bg-surface text-primary"
      )}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  )
}
