// @beitoon/shared  -  single source of truth for Beitoon domain constants, imported
// by BOTH the web app and the API so the two never drift. Pure data + pure
// functions only (zero runtime deps), so it's safe in any environment.

// ── Arabic text normalization (search-friendly matching) ───────────────────
// Egyptians type the same word many ways: "الأقصر" / "الاقصر" (hamza on alef),
// "مصطفى" / "مصطفي" (alef maqsura vs ya), "شقة" / "شقه" (ta marbuta vs ha),
// plus optional tashkeel (diacritics) and tatweel (ـ). Exact match then fails.
// normalizeArabic folds all of these so search "just works". Used on BOTH sides
// of every comparison (the query AND the stored text).
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
const TATWEEL = /\u0640/g;

export function normalizeArabic(input: string): string {
  return (input ?? "")
    .replace(ARABIC_DIACRITICS, "") // strip tashkeel
    .replace(TATWEEL, "") // strip kashida/tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ أ إ ٱ -> ا
    .replace(/\u0649/g, "\u064A") // ى (alef maqsura) -> ي
    .replace(/\u0629/g, "\u0647") // ة (ta marbuta) -> ه
    .replace(/\u0624/g, "\u0648") // ؤ -> و
    .replace(/\u0626/g, "\u064A") // ئ -> ي
    .replace(/\u0621/g, "") // lone hamza -> drop
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .toLowerCase();
}

// Arabic-aware "does haystack contain needle?"  -  normalizes both sides so
// "الاقصر" matches "الأقصر", "شقه" matches "شقة", etc.
export function arabicIncludes(haystack: string, needle: string): boolean {
  const n = normalizeArabic(needle);
  if (!n) return true;
  return normalizeArabic(haystack).includes(n);
}

// Arabic-aware equality (normalized).
export function arabicEquals(a: string, b: string): boolean {
  return normalizeArabic(a) === normalizeArabic(b);
}

// ── Egypt locations (governorate -> areas) ─────────────────────────────────
// Level 1 = محافظة (Egypt's 27 governorates + the New Administrative Capital as
// its own real-estate zone); level 2 = the cities/districts inside it. A stored
// `area` is one canonical "المحافظة · المنطقة" string.
export const EGYPT_LOCATIONS: { city: string; districts: string[] }[] = [
  // ─────────── Greater Cairo ───────────
  {
    city: "القاهرة",
    districts: [
      "التجمع الخامس",
      "التجمع الأول",
      "التجمع الثالث",
      "القاهرة الجديدة",
      "الرحاب",
      "مدينتي",
      "بيت الوطن",
      "النرجس",
      "الياسمين",
      "اللوتس",
      "الأندلس",
      "جنوب الأكاديمية",
      "غرب الجولف",
      "مدينة نصر",
      "مصر الجديدة",
      "المعادي",
      "زهراء المعادي",
      "المقطم",
      "الزمالك",
      "وسط البلد",
      "جاردن سيتي",
      "قصر النيل",
      "المنيل",
      "العباسية",
      "شبرا",
      "روض الفرج",
      "الساحل",
      "غمرة",
      "رمسيس",
      "حدائق القبة",
      "الوايلي",
      "السيدة زينب",
      "مصر القديمة",
      "الخليفة",
      "الدرب الأحمر",
      "دار السلام",
      "البساتين",
      "عين شمس",
      "المطرية",
      "الزيتون",
      "المرج",
      "حلوان",
      "المعصرة",
      "التبين",
      "15 مايو",
      "الشروق",
      "العبور",
      "بدر",
      "الخصوص",
    ],
  },
  {
    city: "الجيزة",
    districts: [
      "المهندسين",
      "الدقي",
      "العجوزة",
      "الهرم",
      "فيصل",
      "إمبابة",
      "بولاق الدكرور",
      "حدائق الأهرام",
      "المنيب",
      "العمرانية",
      "الطالبية",
      "أرض اللواء",
      "المطبعة",
      "الوراق",
      "أوسيم",
      "كرداسة",
      "أبو رواش",
      "6 أكتوبر",
      "الشيخ زايد",
      "حدائق أكتوبر",
      "دريم لاند",
      "بيفرلي هيلز",
      "الحوامدية",
      "البدرشين",
      "العياط",
      "الصف",
      "أطفيح",
      "صفط اللبن",
      "ناهيا",
    ],
  },
  {
    city: "العاصمة الإدارية الجديدة",
    districts: [
      "R1",
      "R2",
      "R3",
      "R5",
      "R7",
      "R8",
      "الحي الحكومي",
      "الحي المالي والأعمال",
      "داون تاون",
      "المجاورة الأولى",
      "المجاورة الثانية",
      "الحي الدبلوماسي",
      "العلمين الجديدة",
    ],
  },
  {
    city: "القليوبية",
    districts: [
      "بنها",
      "شبرا الخيمة",
      "القناطر الخيرية",
      "قليوب",
      "الخانكة",
      "طوخ",
      "كفر شكر",
      "أبو زعبل",
      "مسطرد",
      "العبور",
      "الخصوص",
      "شبين القناطر",
    ],
  },

  // ─────────── الإسكندرية والساحل ───────────
  {
    city: "الإسكندرية",
    districts: [
      "سموحة",
      "سيدي جابر",
      "ميامي",
      "المنتزه",
      "العجمي",
      "سان ستيفانو",
      "لوران",
      "كامب شيزار",
      "محطة الرمل",
      "أبو قير",
      "العصافرة",
      "سيدي بشر",
      "ستانلي",
      "كليوباترا",
      "جليم",
      "رشدي",
      "فلمنج",
      "بولكلي",
      "زيزينيا",
      "المندرة",
      "المعمورة",
      "برج العرب",
      "برج العرب الجديدة",
      "العامرية",
      "المكس",
      "الدخيلة",
      "محرم بك",
      "الإبراهيمية",
      "الشاطبي",
      "المنشية",
      "الأنفوشي",
      "بحري",
      "كرموز",
      "العطارين",
      "الهانوفيل",
      "البيطاش",
      "أبيس",
    ],
  },
  {
    city: "مطروح",
    districts: [
      "مرسى مطروح",
      "الساحل الشمالي",
      "مارينا",
      "العلمين",
      "العلمين الجديدة",
      "سيدي عبد الرحمن",
      "الضبعة",
      "فوكا",
      "رأس الحكمة",
      "سيوة",
      "السلوم",
      "الحمام",
    ],
  },

  // ─────────── الدلتا ───────────
  {
    city: "البحيرة",
    districts: ["دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو المطامير", "النوبارية", "أبو حمص", "الدلنجات", "كوم حمادة", "إيتاي البارود"],
  },
  {
    city: "الغربية",
    districts: ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "سمنود", "بسيون", "قطور"],
  },
  {
    city: "المنوفية",
    districts: ["شبين الكوم", "منوف", "أشمون", "السادات", "قويسنا", "تلا", "بركة السبع", "الباجور", "سرس الليان"],
  },
  {
    city: "الدقهلية",
    districts: ["المنصورة", "طلخا", "ميت غمر", "أجا", "دكرنس", "منية النصر", "بلقاس", "جمصة", "السنبلاوين", "بني عبيد", "المطرية", "شربين", "تمي الأمديد"],
  },
  {
    city: "كفر الشيخ",
    districts: ["كفر الشيخ", "دسوق", "بلطيم", "فوه", "الحامول", "بيلا", "مطوبس", "سيدي سالم", "قلين", "الرياض"],
  },
  {
    city: "دمياط",
    districts: ["دمياط", "دمياط الجديدة", "رأس البر", "فارسكور", "كفر سعد", "عزبة البرج", "الزرقا", "كفر البطيخ", "شطا"],
  },
  {
    city: "الشرقية",
    districts: ["الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح", "أبو حماد", "فاقوس", "ههيا", "أبو كبير", "ديرب نجم", "مشتول السوق", "أولاد صقر", "الحسينية", "كفر صقر", "الإبراهيمية"],
  },

  // ─────────── القناة وسيناء ───────────
  {
    city: "بورسعيد",
    districts: ["الشرق", "العرب", "الضواحي", "المناخ", "الزهور", "بورفؤاد", "الجنوب"],
  },
  {
    city: "الإسماعيلية",
    districts: ["الإسماعيلية", "الشيخ زايد", "التمساح", "نمرة 6", "أبو صوير", "القصاصين", "فايد", "القنطرة شرق", "القنطرة غرب", "التل الكبير"],
  },
  {
    city: "السويس",
    districts: ["الأربعين", "السلام", "فيصل", "عتاقة", "الجناين", "بورتوفيق", "العين السخنة"],
  },
  {
    city: "شمال سيناء",
    districts: ["العريش", "بئر العبد", "الشيخ زويد", "رفح", "الحسنة", "نخل"],
  },
  {
    city: "جنوب سيناء",
    districts: ["شرم الشيخ", "دهب", "نويبع", "طابا", "سانت كاترين", "رأس سدر", "الطور", "أبو رديس", "أبو زنيمة"],
  },

  // ─────────── البحر الأحمر ───────────
  {
    city: "البحر الأحمر",
    districts: ["الغردقة", "الجونة", "سهل حشيش", "مكادي باي", "سوما باي", "سفاجا", "القصير", "مرسى علم", "بورت غالب", "رأس غارب", "الدهار", "الممشى"],
  },

  // ─────────── مصر الوسطى والصعيد ───────────
  {
    city: "الفيوم",
    districts: ["الفيوم", "الفيوم الجديدة", "سنورس", "طامية", "إطسا", "أبشواي", "يوسف الصديق", "قارون"],
  },
  {
    city: "بني سويف",
    districts: ["بني سويف", "بني سويف الجديدة", "الواسطى", "ناصر", "إهناسيا", "ببا", "الفشن", "سمسطا"],
  },
  {
    city: "المنيا",
    districts: ["المنيا", "المنيا الجديدة", "ملوي", "بني مزار", "مطاي", "سمالوط", "مغاغة", "أبو قرقاص", "دير مواس", "العدوة", "مغاغة"],
  },
  {
    city: "أسيوط",
    districts: ["أسيوط", "أسيوط الجديدة", "الوليدية", "ديروط", "منفلوط", "أبنوب", "القوصية", "أبو تيج", "صدفا", "الغنايم", "ساحل سليم", "البداري"],
  },
  {
    city: "سوهاج",
    districts: ["سوهاج", "سوهاج الجديدة", "أخميم", "جرجا", "طهطا", "البلينا", "المراغة", "طما", "جهينة", "دار السلام", "المنشأة", "ساقلتة", "العسيرات"],
  },
  {
    city: "قنا",
    districts: ["قنا", "قنا الجديدة", "نجع حمادي", "قوص", "دشنا", "أبو تشت", "فرشوط", "نقادة", "قفط", "الوقف"],
  },
  {
    city: "الأقصر",
    districts: ["الأقصر", "الأقصر الجديدة", "الكرنك", "البر الغربي", "إسنا", "أرمنت", "الطود", "القرنة", "الزينية", "البياضية"],
  },
  {
    city: "أسوان",
    districts: ["أسوان", "أسوان الجديدة", "السيل", "كيما", "إدفو", "كوم أمبو", "دراو", "نصر النوبة", "أبو سمبل", "كلابشة"],
  },
  {
    city: "الوادي الجديد",
    districts: ["الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"],
  },
];

// The delimiter between governorate and district in a stored area string.
export const AREA_SEP = " · ";

// Build the canonical "المحافظة · المنطقة" string the rest of the app stores.
export function formatArea(city: string, district?: string): string {
  return district && district.trim() ? `${city}${AREA_SEP}${district.trim()}` : city;
}

// Split a stored area string back into its governorate / district parts.
export function parseArea(area?: string): { city: string; district: string } {
  const parts = (area ?? "").split("\u00b7").map((s) => s.trim());
  return { city: parts[0] ?? "", district: parts[1] ?? "" };
}

// Every governorate name (level 1).
export const GOVERNORATES: string[] = EGYPT_LOCATIONS.map((l) => l.city);

// Flat, de-duplicated list of every governorate + district (renter preferred
// areas). Substring matching means "المعادي" still matches "القاهرة · المعادي".
export const AREA_OPTIONS: string[] = Array.from(
  new Set(EGYPT_LOCATIONS.flatMap((l) => [l.city, ...l.districts])),
);

// Validate a stored area string. Accepts a bare governorate ("القاهرة") or
// "محافظة · منطقة" where the governorate is known. Governorate match is Arabic-
// normalized (so "القاهره"/"القاهرة" both pass). District is lenient (owners may
// type a street/compound not in our list); empty is allowed (area optional).
export function isValidArea(area?: string | null): boolean {
  if (area == null || area.trim() === "") return true;
  const { city } = parseArea(area);
  const n = normalizeArabic(city);
  return GOVERNORATES.some((g) => normalizeArabic(g) === n);
}
