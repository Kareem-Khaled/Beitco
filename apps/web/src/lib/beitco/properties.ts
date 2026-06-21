import heroImg from "@/assets/hero-home.jpg";
import maadi from "@/assets/area-maadi.jpg";
import zayed from "@/assets/area-sheikh-zayed.jpg";
import alex from "@/assets/area-alexandria.jpg";
import newCairo from "@/assets/area-new-cairo.jpg";

export type PropertyType = "شقة" | "أوضة" | "سرير";

export type Review = {
  id: string;
  author: string;
  initials: string;
  monthsLived: number;
  rating: number;
  date: string;
  body: string;
};

export type QA = {
  id: string;
  q: string;
  a?: string;
  asker: string;
  answerer?: string;
  date: string;
};

export type PropertyDetail = {
  id: string;
  title: string;
  area: string;
  address: string;
  type: PropertyType;
  price: number;
  trust: number;
  verified: boolean;
  reviewsCount: number;
  residents: number;
  images: string[];
  description: string;
  quality: {
    internet: number;
    safety: number;
    noise: number;
    maintenance: number;
    cleanliness: number;
  };
  amenities: string[];
  costs: { label: string; amount: number }[];
  beds?: { total: number; occupied: number };
  landlord: { name: string; initials: string; trust: number; responseRate: number; verified: boolean };
  reviews: Review[];
  qa: QA[];
};

const sample: Record<string, PropertyDetail> = {
  "1": {
    id: "1",
    title: "شقة شمسها حلوة جنب الجامعة الأمريكية",
    area: "القاهرة الجديدة · التجمع الخامس",
    address: "محور التسعين الجنوبي، التجمع الخامس، القاهرة الجديدة",
    type: "شقة",
    price: 18500,
    trust: 9.2,
    verified: true,
    reviewsCount: 24,
    residents: 6,
    images: [heroImg, newCairo, maadi, zayed],
    description:
      "شقة منوّرة وهادية بأوضتين، على بعد 8 دقايق من الجامعة الأمريكية. مفروشة بالكامل، نت فايبر، وكومباوند مؤمَّن بحراسة 24 ساعة. تنفع لعروسين أو لتنين زمايل شغل عايزين يشاركوا.",
    quality: { internet: 9.4, safety: 9.1, noise: 8.7, maintenance: 9.0, cleanliness: 9.3 },
    amenities: [
      "نت 200 ميجا",
      "تكييف",
      "غسالة",
      "ميكروويف",
      "تلاجة",
      "أسانسير",
      "جراج مغطى",
      "أمن 24 ساعة",
      "مفروشة",
    ],
    costs: [
      { label: "الإيجار", amount: 18500 },
      { label: "النت", amount: 450 },
      { label: "الكهربا (متوسط)", amount: 900 },
      { label: "المياه", amount: 120 },
      { label: "رسوم خدمة", amount: 350 },
    ],
    landlord: {
      name: "مصطفى ح.",
      initials: "م.ح",
      trust: 9.4,
      responseRate: 97,
      verified: true,
    },
    reviews: [
      {
        id: "r1",
        author: "نور أ.",
        initials: "ن.أ",
        monthsLived: 11,
        rating: 9.4,
        date: "مارس 2026",
        body:
          "بصراحة من أهدى الشوارع في التجمع الخامس. النت ما بيقطعش وانت في الميتنجات، التكييف شغّال في كل الأوض، ومصطفى بيصلّح أي حاجة في يوم واحد.",
      },
      {
        id: "r2",
        author: "كريم س.",
        initials: "ك.س",
        monthsLived: 6,
        rating: 9.0,
        date: "يناير 2026",
        body:
          "السعر ممتاز بالنسبة للمنطقة. شوية دوشة يوم الجمعة بالليل بسبب الكافيه اللي قريب، بس عدا كده الشقة نضيفة جدًا والمكان آمن.",
      },
      {
        id: "r3",
        author: "ياسمين ر.",
        initials: "ي.ر",
        monthsLived: 14,
        rating: 9.6,
        date: "نوفمبر 2025",
        body:
          "قعدت هنا عقدين متتاليين. صاحب الشقة محترم ومش بيدخل من غير ما يقول، وعمّال العمارة محترفين.",
      },
    ],
    qa: [
      {
        id: "q1",
        asker: "عمر",
        answerer: "مصطفى ح. (صاحب الشقة)",
        date: "من أسبوعين",
        q: "النت بيبقى كويس قد إيه للميتنجات بالنهار؟",
        a: "فايبر 200/200. فيه ساكنين شغّالين ريموت طول اليوم من غير أي مشكلة.",
      },
      {
        id: "q2",
        asker: "سارة",
        date: "من 5 أيام",
        q: "فيه سوبر ماركت قريب نقدر نمشي له؟",
      },
    ],
  },
  "3": {
    id: "3",
    title: "سكن طلبة · سرير في أوضة مشتركة",
    area: "المعادي · شارع 9",
    address: "شارع 9، المعادي، القاهرة",
    type: "سرير",
    price: 3200,
    trust: 8.1,
    verified: false,
    reviewsCount: 32,
    residents: 8,
    images: [maadi, heroImg, newCairo, alex],
    description:
      "مكان لطلبة وشغّالين ريموت، على بعد مشي من كافيهات شارع 9 ومترو المعادي. مطبخ مشترك، ونضافة أسبوعية محسوبة في السعر.",
    quality: { internet: 8.4, safety: 8.6, noise: 7.4, maintenance: 8.0, cleanliness: 8.5 },
    amenities: ["نت 100 ميجا", "تكييف", "غسالة", "مطبخ مشترك", "نضافة أسبوعية", "مكان شغل"],
    costs: [
      { label: "إيجار السرير", amount: 3200 },
      { label: "الفواتير (شاملة)", amount: 0 },
      { label: "النضافة", amount: 0 },
    ],
    beds: { total: 8, occupied: 6 },
    landlord: { name: "بيتكو كولايفنج", initials: "ب.ك", trust: 8.6, responseRate: 92, verified: true },
    reviews: [
      {
        id: "r1",
        author: "هنا م.",
        initials: "ه.م",
        monthsLived: 4,
        rating: 8.4,
        date: "أبريل 2026",
        body: "نضيف، الزمايل لطاف، والمكان جامد. بس بيبقى فيه شوية دوشة في الويك إند.",
      },
    ],
    qa: [],
  },
};

export function getProperty(id: string): PropertyDetail | undefined {
  return sample[id] ?? sample["1"];
}
