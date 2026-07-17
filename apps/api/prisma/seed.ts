// Beitoon seed — ports apps/web/src/lib/beitco/seed-data.ts into Postgres so the
// API serves the same demo users + listings the frontend prototype shows today
// (B-0.1 seed parity). Run with: pnpm --filter @beitoon/api db:seed
//
// Arabic display strings stay as data; only enum fields map to the schema's
// Latin enum values (mappers below). Idempotent: wipes the demo tables first.

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ── Enum mappers (Arabic UI term -> Latin schema value) ──
const TYPE: Record<string, 'apartment' | 'room' | 'bed'> = {
  شقة: 'apartment',
  أوضة: 'room',
  سرير: 'bed',
};
const UNIT: Record<string, 'apartment' | 'studio' | 'duplex' | 'roof' | 'villa'> = {
  شقة: 'apartment',
  استوديو: 'studio',
  دوبلكس: 'duplex',
  روف: 'roof',
  فيلا: 'villa',
};
const NEARBY: Record<string, 'metro' | 'university' | 'transit' | 'mall' | 'hospital' | 'supermarket' | 'other'> = {
  مترو: 'metro',
  جامعة: 'university',
  مواصلات: 'transit',
  مول: 'mall',
  مستشفى: 'hospital',
  'سوبر ماركت': 'supermarket',
  'حاجة تانية': 'other',
};
const vstatus = (verified: boolean): 'verified' | 'unverified' =>
  verified ? 'verified' : 'unverified';

// ── Users (owners + admin + renters) ──
type SeedUser = {
  id: string;
  phone: string;
  name: string;
  role: 'renter' | 'owner' | 'both';
  verified: boolean;
  trust: number;
  responseRate?: number;
  isAdmin?: boolean;
  createdAt: string;
};

const users: SeedUser[] = [
  { id: 'u-admin', phone: '+201000000000', name: 'فريق بيتون', role: 'both', verified: true, trust: 9.9, isAdmin: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'u-mostafa', phone: '+201001234567', name: 'مصطفى حسن', role: 'owner', verified: true, trust: 9.4, responseRate: 97, createdAt: '2024-06-01T00:00:00Z' },
  { id: 'u-coliving', phone: '+201005550001', name: 'بيتون كولايفنج', role: 'owner', verified: true, trust: 8.6, responseRate: 92, createdAt: '2024-08-01T00:00:00Z' },
  { id: 'u-zayed', phone: '+201005550002', name: 'أحمد عبده', role: 'owner', verified: false, trust: 8.5, responseRate: 88, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'u-fam', phone: '+201005550003', name: 'هدى مراد', role: 'owner', verified: true, trust: 8.2, responseRate: 91, createdAt: '2024-10-01T00:00:00Z' },
  { id: 'u-students', phone: '+201005550004', name: 'سكن النيل', role: 'owner', verified: true, trust: 8.7, responseRate: 95, createdAt: '2024-07-01T00:00:00Z' },
  { id: 'u-alex', phone: '+201005550005', name: 'ليلى جابر', role: 'owner', verified: false, trust: 8.0, responseRate: 85, createdAt: '2025-02-01T00:00:00Z' },
  { id: 'u-renter-ahmed', phone: '+201111222333', name: 'أحمد سمير', role: 'renter', verified: true, trust: 7.2, createdAt: '2025-02-10T00:00:00Z' },
  { id: 'u-renter-mona', phone: '+201222333444', name: 'منى خالد', role: 'renter', verified: false, trust: 6.8, createdAt: '2025-03-15T00:00:00Z' },
  { id: 'u-renter-omar', phone: '+201001239876', name: 'عمر فاروق', role: 'renter', verified: true, trust: 8.1, createdAt: '2025-01-05T00:00:00Z' },
  { id: 'u-renter-sara', phone: '+201155667788', name: 'سارة إبراهيم', role: 'renter', verified: true, trust: 7.9, createdAt: '2025-04-20T00:00:00Z' },
  { id: 'u-renter-youssef', phone: '+201099887766', name: 'يوسف ناصر', role: 'renter', verified: false, trust: 6.4, createdAt: '2025-05-01T00:00:00Z' },
];

// ── Properties (mirrors seed-data.ts) ──
type Bed = { label: string; status: 'available' | 'occupied' | 'reserved'; price: number; features?: string[]; occupant?: { userId?: string; name: string; phone: string; moveInDate: string; notes?: string } };
type Room = { name: string; features: string[]; sizeM2?: number; price?: number; status?: 'available' | 'occupied' | 'reserved'; beds: Bed[] };
type Review = { authorId?: string; authorName: string; initials: string; monthsLived: number; rating: number; body: string };
type Nearby = { type: string; name: string; line?: string; minutes?: number };
type Custom = { label: string; value: string };
type Quality = { internet: number; safety: number; noise: number; maintenance: number; cleanliness: number };
type Cost = { label: string; amount: number };

type SeedProp = {
  id: string;
  ownerId: string;
  title: string;
  area: string;
  address: string;
  lat?: number;
  lng?: number;
  type: string;
  status: 'published';
  price: number;
  priceFrom: number;
  trust: number;
  verified: boolean;
  reviewsCount: number;
  residents: number;
  image: string;
  description: string;
  quality: Quality;
  amenities: string[];
  costs: Cost[];
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  sizeM2?: number;
  furnished: boolean;
  rentalMode?: 'whole' | 'by_room' | 'by_bed';
  wholePrice?: number;
  wholeStatus?: 'available' | 'occupied' | 'reserved';
  nightlyPrice?: number;
  listingType?: 'rent' | 'sale';
  salePrice?: number;
  saleStatus?: 'available' | 'sold';
  negotiable?: boolean;
  rentToGender?: 'male_only' | 'female_only';
  rooms: Room[];
  nearby: Nearby[];
  customSpecs: Custom[];
  reviews: Review[];
  createdAt: string;
};

const properties: SeedProp[] = [
  {
    id: '1', ownerId: 'u-mostafa', title: 'شقة شمسها حلوة جنب الجامعة الأمريكية',
    area: 'القاهرة الجديدة · التجمع الخامس', address: 'محور التسعين الجنوبي، التجمع الخامس، القاهرة الجديدة',
    lat: 30.0235, lng: 31.4912, type: 'شقة', status: 'published', price: 18500, priceFrom: 18500,
    trust: 9.2, verified: true, reviewsCount: 24, residents: 6,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    description: 'شقة منوّرة وهادية بأوضتين، على بعد 8 دقايق من الجامعة الأمريكية. مفروشة بالكامل، نت فايبر، وكومباوند مؤمَّن بحراسة 24 ساعة. تنفع لعروسين أو لتنين زمايل شغل عايزين يشاركوا.',
    quality: { internet: 9.4, safety: 9.1, noise: 8.7, maintenance: 9.0, cleanliness: 9.3 },
    amenities: ['نت 200 ميجا', 'تكييف', 'غسالة', 'ميكروويف', 'تلاجة', 'أسانسير', 'جراج مغطى', 'أمن 24 ساعة', 'مفروشة'],
    costs: [{ label: 'الإيجار', amount: 18500 }, { label: 'النت', amount: 450 }, { label: 'الكهربا (متوسط)', amount: 900 }, { label: 'المياه', amount: 120 }, { label: 'رسوم خدمة', amount: 350 }],
    unitType: 'شقة', bedrooms: 2, bathrooms: 2, floor: 3, sizeM2: 120, furnished: true,
    rentalMode: 'whole', wholePrice: 18500, wholeStatus: 'available',
    rooms: [
      { name: 'الأوضة الرئيسية', features: ['تكييف', 'حمام خاص', 'بلكونة'], sizeM2: 24, beds: [] },
      { name: 'الأوضة التانية', features: ['تكييف', 'دولاب'], sizeM2: 16, beds: [] },
    ],
    nearby: [
      { type: 'جامعة', name: 'الجامعة الأمريكية', minutes: 8 },
      { type: 'مول', name: 'كايرو فيستيفال سيتي', minutes: 12 },
      { type: 'سوبر ماركت', name: 'كارفور', minutes: 5 },
    ],
    customSpecs: [{ label: 'اتجاه الشمس', value: 'بحري - شرقي' }, { label: 'التشطيب', value: 'سوبر لوكس' }],
    reviews: [
      { authorName: 'نور أ.', initials: 'ن.أ', monthsLived: 11, rating: 9.4, body: 'بصراحة من أهدى الشوارع في التجمع الخامس. النت ما بيقطعش وانت في الميتنجات، التكييف شغّال في كل الأوض، ومصطفى بيصلّح أي حاجة في يوم واحد.' },
      { authorName: 'كريم س.', initials: 'ك.س', monthsLived: 6, rating: 9.0, body: 'السعر ممتاز بالنسبة للمنطقة. شوية دوشة يوم الجمعة بالليل بسبب الكافيه اللي قريب، بس عدا كده الشقة نضيفة جدًا والمكان آمن.' },
      { authorName: 'ياسمين ر.', initials: 'ي.ر', monthsLived: 14, rating: 9.6, body: 'قعدت هنا عقدين متتاليين. صاحب الشقة محترم ومش بيدخل من غير ما يقول، وعمّال العمارة محترفين.' },
    ],
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: '2', ownerId: 'u-coliving', title: 'أوضة مشتركة في المعادي',
    area: 'المعادي · شارع 9', address: 'شارع 9، المعادي، القاهرة',
    lat: 29.9603, lng: 31.2569, type: 'سرير', status: 'published', price: 3200, priceFrom: 2800,
    trust: 8.1, verified: true, reviewsCount: 32, residents: 8,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    description: 'مكان لطلبة وشغّالين ريموت، على بعد مشي من كافيهات شارع 9 ومترو المعادي. مطبخ مشترك، ونضافة أسبوعية محسوبة في السعر.',
    quality: { internet: 8.4, safety: 8.6, noise: 7.4, maintenance: 8.0, cleanliness: 8.5 },
    amenities: ['نت 100 ميجا', 'تكييف', 'غسالة', 'مطبخ مشترك', 'نضافة أسبوعية', 'مكان شغل'],
    costs: [{ label: 'إيجار السرير', amount: 3200 }],
    unitType: 'شقة', bedrooms: 3, bathrooms: 2, floor: 2, sizeM2: 150, furnished: true,
    rentalMode: 'by_bed',
    rooms: [
      { name: 'الأوضة الكبيرة المكيّفة', features: ['تكييف', 'بلكونة'], beds: [
        { label: 'سرير 1', status: 'reserved', price: 3500, occupant: { userId: 'u-renter-ahmed', name: 'أحمد سمير', phone: '+201111222333', moveInDate: '2026-07-01', notes: 'دفع عربون نص شهر' } },
        { label: 'سرير 2', status: 'occupied', price: 3500 },
        { label: 'سرير 3 (جنب الشباك)', status: 'available', price: 3500, features: ['جنب الشباك'] },
      ] },
      { name: 'أوضة الوسط', features: ['تكييف'], beds: [
        { label: 'سرير 1', status: 'occupied', price: 3200 },
        { label: 'سرير 2', status: 'occupied', price: 3200 },
        { label: 'سرير 3', status: 'occupied', price: 3200 },
      ] },
      { name: 'الأوضة الصغيرة', features: [], beds: [
        { label: 'سرير 1', status: 'occupied', price: 2800 },
        { label: 'سرير 2', status: 'available', price: 2800 },
      ] },
    ],
    nearby: [],
    customSpecs: [],
    reviews: [
      { authorName: 'هنا م.', initials: 'ه.م', monthsLived: 4, rating: 8.4, body: 'نضيف، الزمايل لطاف، والمكان جامد. بس بيبقى فيه شوية دوشة في الويك إند.' },
    ],
    createdAt: '2025-11-15T00:00:00Z',
  },
  {
    id: '3', ownerId: 'u-zayed', title: 'سرير في كومباوند الشيخ زايد',
    area: 'الشيخ زايد · الحي التاني', address: 'الحي التاني، الشيخ زايد، الجيزة',
    lat: 30.0411, lng: 30.9747, type: 'سرير', status: 'published', price: 4500, priceFrom: 3800,
    trust: 8.8, verified: false, reviewsCount: 15, residents: 4,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    description: 'كومباوند هادي وآمن، مساحات خضرا، نوادي رياضية قريبة. السرير في أوضة لتنين مع زميل واحد. تنفع لشغّالين شركات.',
    quality: { internet: 9.0, safety: 9.2, noise: 8.5, maintenance: 8.7, cleanliness: 8.8 },
    amenities: ['نت 200 ميجا', 'تكييف', 'غسالة', 'أسانسير', 'أمن 24 ساعة', 'حمام سباحة'],
    costs: [{ label: 'إيجار السرير', amount: 4500 }, { label: 'الكهربا والمياه', amount: 400 }, { label: 'النت', amount: 200 }],
    unitType: 'شقة', bedrooms: 2, bathrooms: 1, floor: 4, sizeM2: 90, furnished: true,
    rentalMode: 'by_bed', rentToGender: 'male_only',
    rooms: [
      { name: 'أوضة مكيّفة بحمام خاص', features: ['تكييف', 'حمام خاص'], beds: [
        { label: 'سرير 1', status: 'available', price: 4500 },
        { label: 'سرير 2', status: 'available', price: 4500 },
        { label: 'سرير 3', status: 'occupied', price: 4500 },
      ] },
      { name: 'الأوضة العادية', features: ['دولاب'], beds: [
        { label: 'سرير 1', status: 'available', price: 3800 },
        { label: 'سرير 2', status: 'occupied', price: 3800 },
        { label: 'سرير 3', status: 'occupied', price: 4000 },
      ] },
    ],
    nearby: [],
    customSpecs: [],
    reviews: [],
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: '4', ownerId: 'u-fam', title: 'شقة عيلة في مدينة نصر',
    area: 'مدينة نصر · عباس العقاد', address: 'شارع عباس العقاد، مدينة نصر، القاهرة',
    lat: 30.0588, lng: 31.3401, type: 'شقة', status: 'published', price: 12000, priceFrom: 12000,
    trust: 7.9, verified: true, reviewsCount: 18, residents: 5,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
    description: 'شقة 3 أوض في قلب عباس العقاد. قريبة من الميادين الرئيسية والمواصلات. تنفع لعيلة صغيرة.',
    quality: { internet: 8.2, safety: 8.0, noise: 6.8, maintenance: 7.9, cleanliness: 8.3 },
    amenities: ['نت 100 ميجا', 'تكييف', 'غسالة', 'ميكروويف', 'تلاجة', 'أسانسير', 'مفروشة'],
    costs: [{ label: 'الإيجار', amount: 12000 }, { label: 'النت', amount: 350 }, { label: 'الكهربا', amount: 700 }],
    unitType: 'شقة', bedrooms: 3, bathrooms: 2, floor: 5, sizeM2: 140, furnished: true,
    rentalMode: 'whole', wholePrice: 12000, wholeStatus: 'available', nightlyPrice: 850,
    rooms: [
      { name: 'أوضة النوم الرئيسية', features: ['تكييف', 'حمام خاص'], beds: [] },
      { name: 'أوضة الأطفال', features: ['تكييف'], beds: [] },
      { name: 'مكتب / أوضة ضيوف', features: ['دولاب'], beds: [] },
    ],
    nearby: [],
    customSpecs: [],
    reviews: [],
    createdAt: '2025-12-20T00:00:00Z',
  },
  {
    id: '5', ownerId: 'u-students', title: 'سكن طلبة جنب جامعة القاهرة',
    area: 'الدقي · شارع التحرير', address: 'شارع التحرير، الدقي، الجيزة',
    lat: 30.0385, lng: 31.2118, type: 'سرير', status: 'published', price: 2800, priceFrom: 2800,
    trust: 8.5, verified: true, reviewsCount: 42, residents: 10,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&h=400&fit=crop',
    description: 'سكن طلبة منظّم، خمس دقايق من جامعة القاهرة. سراير في أوض لأربعة. مطبخ مشترك ومسؤول مقيم.',
    quality: { internet: 8.8, safety: 8.4, noise: 7.0, maintenance: 8.2, cleanliness: 8.7 },
    amenities: ['نت 150 ميجا', 'تكييف', 'غسالة', 'مطبخ مشترك', 'مسؤول مقيم'],
    costs: [{ label: 'إيجار السرير', amount: 2800 }],
    unitType: 'شقة', bedrooms: 4, bathrooms: 2, floor: 6, sizeM2: 160, furnished: true,
    rentalMode: 'by_bed',
    rooms: [
      { name: 'أوضة 4 سراير مكيّفة', features: ['تكييف'], beds: [
        { label: 'سرير 1', status: 'occupied', price: 3000 },
        { label: 'سرير 2', status: 'occupied', price: 3000 },
        { label: 'سرير 3', status: 'occupied', price: 3000 },
        { label: 'سرير 4', status: 'available', price: 3000 },
      ] },
      { name: 'أوضة 3 سراير', features: [], beds: [
        { label: 'سرير 1', status: 'occupied', price: 2800 },
        { label: 'سرير 2', status: 'available', price: 2800 },
        { label: 'سرير 3', status: 'occupied', price: 2800 },
      ] },
      { name: 'أوضة 3 سراير', features: [], beds: [
        { label: 'سرير 1', status: 'available', price: 2800 },
        { label: 'سرير 2', status: 'available', price: 2800 },
        { label: 'سرير 3', status: 'occupied', price: 2800 },
      ] },
    ],
    nearby: [
      { type: 'مترو', name: 'البحوث', line: 'الخط الثاني', minutes: 6 },
      { type: 'جامعة', name: 'جامعة القاهرة', minutes: 10 },
      { type: 'مواصلات', name: 'موقف الجيزة', minutes: 4 },
    ],
    customSpecs: [{ label: 'النظام', value: 'طلبة وموظفين بس' }],
    reviews: [],
    createdAt: '2025-08-01T00:00:00Z',
  },
  {
    id: '6', ownerId: 'u-alex', title: 'أوضة لوحدها في إسكندرية',
    area: 'سموحة · شارع فوزي معاذ', address: 'شارع فوزي معاذ، سموحة، إسكندرية',
    lat: 31.2156, lng: 29.9553, type: 'أوضة', status: 'published', price: 5500, priceFrom: 5500,
    trust: 8.3, verified: false, reviewsCount: 11, residents: 3,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop',
    description: 'أوضة لوحدها في شقة هادية في سموحة. شغّالين معايا تنين بنات محترمات. تنفع لبنت شغالة أو طالبة.',
    quality: { internet: 7.8, safety: 8.5, noise: 8.1, maintenance: 7.9, cleanliness: 8.4 },
    amenities: ['نت 100 ميجا', 'تكييف', 'غسالة', 'تلاجة', 'مفروشة'],
    costs: [{ label: 'إيجار الأوضة', amount: 5500 }, { label: 'النت والكهربا', amount: 500 }],
    unitType: 'شقة', bedrooms: 4, bathrooms: 2, floor: 3, sizeM2: 175, furnished: true,
    rentalMode: 'by_room', rentToGender: 'female_only',
    rooms: [
      { name: 'أوضة على البحر', features: ['تكييف', 'حمام خاص', 'بلكونة', 'إطلالة بحر', 'تراس خاص'], price: 6500, status: 'available', beds: [] },
      { name: 'أوضة كبيرة مكيّفة', features: ['تكييف', 'دولاب'], price: 5500, status: 'available', beds: [] },
      { name: 'أوضة متوسطة', features: ['دولاب'], price: 4500, status: 'occupied', beds: [] },
      { name: 'أوضة صغيرة', features: [], price: 3800, status: 'occupied', beds: [] },
    ],
    nearby: [],
    customSpecs: [],
    reviews: [],
    createdAt: '2026-02-05T00:00:00Z',
  },
  {
    id: '7', ownerId: 'u-mostafa', title: 'شقة للبيع تشطيب سوبر لوكس في التجمع',
    area: 'القاهرة الجديدة · التجمع الخامس', address: 'جنوب الأكاديمية، التجمع الخامس، القاهرة الجديدة',
    lat: 30.0188, lng: 31.4705, type: 'شقة', status: 'published', price: 4200000, priceFrom: 4200000,
    trust: 9.0, verified: true, reviewsCount: 0, residents: 0,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
    description: 'شقة 165 متر، 3 غرف وريسبشن كبير، تشطيب سوبر لوكس بالكامل. الدور التالت بأسانسير، فيو على لاندسكيب، وقريبة من كل الخدمات. التمليك جاهز والشقة فاضية للمعاينة في أي وقت.',
    quality: { internet: 8.5, safety: 9.0, noise: 8.4, maintenance: 8.8, cleanliness: 9.0 },
    amenities: ['تكييف', 'أسانسير', 'جراج مغطى', 'أمن 24 ساعة', 'حديقة', 'مفروشة'],
    costs: [],
    unitType: 'شقة', bedrooms: 3, bathrooms: 2, floor: 3, sizeM2: 165, furnished: true,
    listingType: 'sale', salePrice: 4200000, saleStatus: 'available', negotiable: true,
    rooms: [],
    nearby: [
      { type: 'مول', name: 'داون تاون مول', minutes: 7 },
      { type: 'جامعة', name: 'الجامعة الأمريكية', minutes: 10 },
    ],
    customSpecs: [{ label: 'التشطيب', value: 'سوبر لوكس' }, { label: 'نوع التمليك', value: 'مسجّل' }],
    reviews: [],
    createdAt: '2026-05-20T00:00:00Z',
  },
];

async function main() {
  console.log('Seeding Beitoon demo data...');

  // Idempotent: clear demo tables, children first. Most FKs cascade from
  // Property/User, but a few are RESTRICT (e.g. renter_reviews.property_id),
  // so we delete the engagement/review tables explicitly before the parents.
  await prisma.reviewHelpfulVote.deleteMany();
  await prisma.renterReview.deleteMany();
  await prisma.responseEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.leadUnit.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.tenancy.deleteMany();
  await prisma.question.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.occupant.deleteMany();
  await prisma.review.deleteMany();
  await prisma.nearbyPlace.deleteMany();
  await prisma.customSpec.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.property.deleteMany();
  await prisma.renterProfile.deleteMany();
  await prisma.user.deleteMany();

  // Users
  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.id,
        phone: u.phone,
        name: u.name,
        role: u.role,
        isAdmin: u.isAdmin ?? false,
        verified: u.verified,
        verificationStatus: vstatus(u.verified),
        trust: u.trust,
        responseRate: u.responseRate ?? null,
        createdAt: new Date(u.createdAt),
      },
    });
  }
  console.log(`  users: ${users.length}`);

  // Properties (+ nested rooms/beds/occupants, nearby, customSpecs, reviews)
  let roomCount = 0;
  let bedCount = 0;
  let reviewCount = 0;
  for (const p of properties) {
    await prisma.property.create({
      data: {
        id: p.id,
        ownerId: p.ownerId,
        title: p.title,
        description: p.description,
        area: p.area,
        address: p.address,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        type: TYPE[p.type],
        status: p.status,
        listingType: p.listingType ?? 'rent',
        rentalMode: p.rentalMode ?? null,
        unitType: UNIT[p.unitType],
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        floor: p.floor ?? null,
        sizeM2: p.sizeM2 ?? null,
        furnished: p.furnished,
        price: p.price,
        priceFrom: p.priceFrom,
        wholePrice: p.wholePrice ?? null,
        wholeStatus: p.wholeStatus ?? null,
        nightlyPrice: p.nightlyPrice ?? null,
        salePrice: p.salePrice ?? null,
        saleStatus: p.saleStatus ?? null,
        negotiable: p.negotiable ?? false,
        rentToGender: p.rentToGender ?? null,
        images: [p.image],
        amenities: p.amenities,
        costs: p.costs as unknown as Prisma.InputJsonValue,
        trust: p.trust,
        verified: p.verified,
        quality: p.quality as unknown as Prisma.InputJsonValue,
        reviewsCount: p.reviewsCount,
        residents: p.residents,
        createdAt: new Date(p.createdAt),
        nearby: {
          create: p.nearby.map((n) => ({ type: NEARBY[n.type], name: n.name, line: n.line ?? null, minutes: n.minutes ?? null })),
        },
        customSpecs: { create: p.customSpecs.map((c) => ({ label: c.label, value: c.value })) },
        reviews: {
          create: p.reviews.map((r) => ({
            authorId: r.authorId ?? null,
            authorName: r.authorName,
            initials: r.initials,
            monthsLived: r.monthsLived,
            rating: r.rating,
            body: r.body,
          })),
        },
      },
    });

    // Rooms + beds (+ occupant on a bed when present)
    for (const r of p.rooms) {
      const room = await prisma.room.create({
        data: {
          propertyId: p.id,
          name: r.name,
          features: r.features,
          sizeM2: r.sizeM2 ?? null,
          price: r.price ?? null,
          status: r.status ?? null,
        },
      });
      roomCount++;
      for (const b of r.beds) {
        const bed = await prisma.bed.create({
          data: { roomId: room.id, label: b.label, status: b.status, price: b.price, features: b.features ?? [] },
        });
        bedCount++;
        if (b.occupant) {
          await prisma.occupant.create({
            data: {
              bedId: bed.id,
              userId: b.occupant.userId ?? null,
              linkStatus: b.occupant.userId ? 'confirmed' : null,
              name: b.occupant.name,
              phone: b.occupant.phone,
              moveInDate: new Date(b.occupant.moveInDate),
              notes: b.occupant.notes ?? null,
            },
          });
        }
      }
    }
    reviewCount += p.reviews.length;
  }

  console.log(`  properties: ${properties.length} | rooms: ${roomCount} | beds: ${bedCount} | reviews: ${reviewCount}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
